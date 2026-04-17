import { ICurrentUser } from '@core/types';
import { DatabaseService, EnrollmentRepository, PlatformUserRepository, SchoolAdminRepository, StudentRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, PlatformUserRole, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString, sanitizeInput } from '@shared/utils';

interface UpdateStudentUseCaseInput {
  data: {
    studentId: string;
    accountType: BusinessModelEnum;
    schoolId?: string;
    name?: string;
    email?: string;
    contactNumber?: string | null;
    dateOfBirth?: string | null;
    guardian?: {
      name?: string | null;
      email?: string | null;
      contactNumber?: string | null;
    };
    gradeId?: number;
    sectionId?: number;
    avatarUrl?: string | null;
  };
  user: ICurrentUser;
}

export class UpdateStudentUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      studentRepo: StudentRepository;
      userAccountRepo: UserAccountRepository;
      ws: WSGateway;
      enrollmentRepo: EnrollmentRepository;
    },
  ) {}

  async execute(input: UpdateStudentUseCaseInput) {
    const { logger, dbService, studentRepo, userAccountRepo, enrollmentRepo, ws } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const updateStudentPayload = {
      studentId: data.studentId,
      accountType: data.accountType,
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      contactNumber: sanitizeInput(data.contactNumber),
      dateOfBirth: sanitizeInput(data.dateOfBirth),
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      guardianName: sanitizeInput(data.guardian?.name),
      guardianEmail: sanitizeInput(data.guardian?.email),
      guardianContactNumber: sanitizeInput(data.guardian?.contactNumber),
      avatarUrl: sanitizeInput(data.avatarUrl),
      updatedAt: actionAt,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(updateStudentPayload, {
          schoolId: user.schoolId,
          accountType: BusinessModelEnum.B2B,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const updatedStudent = await studentRepo.updateStudent(updateStudentPayload);

    if (updatedStudent) {
      const studentActiveEnrollment = await studentRepo.getEnrollment({
        schoolId: updatedStudent.schoolId,
        studentId: updatedStudent.id,
        enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
      });

      if (studentActiveEnrollment) {
        await studentRepo.updateEnrollment({
          gradeId: updateStudentPayload.gradeId,
          sectionId: updateStudentPayload.sectionId,
          qStudentId: updatedStudent.id,
          qSchoolId: updatedStudent.schoolId,
          qAcademicYearId: studentActiveEnrollment.academicYearId,
          updatedAt: actionAt,
        });
      }

      if (data.email) {
        await userAccountRepo.updateUserAccount({
          userAccountId: updatedStudent.userAccountId,
          email: updatedStudent.email,
          updatedAt: actionAt,
        });
      }
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        studentName: updatedStudent?.name,
        schoolId: updatedStudent?.schoolId,
      },
    })
      .then(() => logger.log(`System notification sent successfully for challenge: ${updatedStudent?.name}`))
      .catch((error) => logger.error(`Failed to send system notification for challenge ${updatedStudent?.name}. Error:`, error));
    return updatedStudent;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        studentName: data.studentName,
      };

      switch (user.scope) {
        case UserScope.PLATFORM_USER: {
          Object.assign(templatePayload, {
            scopeName: 'Trusity',
          });

          if (user.role === PlatformUserRole.USER) {
            Object.assign(templatePayload, {
              scopeName: 'Trusity Admin',
            });
          }

          break;
        }
        case UserScope.SCHOOL_ADMIN: {
          Object.assign(templatePayload, {
            scopeName: 'School Admin',
          });
          break;
        }
        default: {
          throw new BadRequestException('Invalid user scope for creating a challenge');
        }
      }

      const [platformUsers, schoolAdmins] = await Promise.all([platformUserRepo.getPlatformUsers(operationPayload), schoolAdminRepo.getSchoolAdmins(operationPayload)]);

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.UPDATED_STUDENT,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify(data),
        createdBy: user.userAccountId,
      };
      const schoolAdminNotificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: `Trusity has updated the details of student ${data.studentName}`,
        data: JSON.stringify(data),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);
      const schoolAdminNotification = await notificationRepo.createNotification(schoolAdminNotificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
        });
      });

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: schoolAdminNotification.id,
          userAccountId: schoolAdmin.userAccountId,
        });
      });

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
        const liveRecipients = notificationRecipients.map((recipient) => ({
          id: String(recipient.userAccountId),
          reFetchNotification: true,
        }));
        ws.sendMessage(liveRecipients);
      }
    },
  });
}
