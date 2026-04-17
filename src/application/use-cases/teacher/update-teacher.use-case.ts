import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, SchoolRepository, TeacherRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString, sanitizeInput } from '@shared/utils';

interface UpdateTeacherUseCaseInput {
  data: {
    teacherId: string;
    name?: string;
    email?: string;
    contactNumber?: string | null;
    assignedClasses?: {
      gradeId: number;
      sectionIds: number[];
    }[];
  };
  user: ICurrentUser;
}

export class UpdateTeacherUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
      userAccountRepo: UserAccountRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      dbService: DatabaseService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
      sessionRepo: SessionRepository;
    },
  ) {}

  async execute(input: UpdateTeacherUseCaseInput) {
    const { teacherRepo, userAccountRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const updateTeacherPayload = {
      teacherId: data.teacherId,
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      contactNumber: sanitizeInput(data.contactNumber),
      updatedAt: actionAt,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(updateTeacherPayload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const updatedTeacher = await teacherRepo.updateTeacher(updateTeacherPayload);

    if (updatedTeacher) {
      if (data.assignedClasses) {
        const assignments: { teacherId: number; schoolId: number; gradeId: number; sectionId: number }[] = [];

        for (const assignedClass of data.assignedClasses) {
          for (const sectionId of assignedClass.sectionIds) {
            assignments.push({
              teacherId: updatedTeacher.id,
              schoolId: updatedTeacher.schoolId,
              gradeId: assignedClass.gradeId,
              sectionId,
            });
          }
        }

        if (assignments.length > 0) {
          await teacherRepo.deleteTeacherClassAssignments({
            teacherId: updatedTeacher.id,
            schoolId: updatedTeacher.schoolId,
          });

          await teacherRepo.associateTeacherClassAssignments(assignments);

          const teacherGradeSectionList = await teacherRepo.getTeacherGradeSectionList({
            teacherId: updatedTeacher.id,
            schoolId: updatedTeacher.schoolId,
          });

          await this.dependencies.sessionRepo.updateTeacherSessions({
            teacherId: updatedTeacher.id,
            schoolId: updatedTeacher.schoolId,
            userAccountId: updatedTeacher.userAccountId,
            classAssignments: teacherGradeSectionList,
          });
        }
      }

      if (data.email) {
        await userAccountRepo.updateUserAccount({
          userAccountId: updatedTeacher.userAccountId,
          email: updatedTeacher.email,
        });
      }
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        teacherName: updatedTeacher?.name,
        schoolId: updatedTeacher?.schoolId,
      },
    })
      .then(() => console.log(`System notification sent successfully for TECHER: ${updatedTeacher?.name}`))
      .catch((error) => console.error(`Failed to send system notification for TEACHER ${updatedTeacher?.name}. Error:`, error));

    return updatedTeacher;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      schoolRepo: new SchoolRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolAdminRepo, schoolRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const [platformUsers, schoolAdmins, school] = await Promise.all([
        platformUserRepo.getPlatformUsers(operationPayload),
        schoolAdminRepo.getSchoolAdmins(operationPayload),
        schoolRepo.getSchool(operationPayload),
      ]);

      if (!school) {
        return;
      }

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        teacherName: data.teacherName,
        schoolName: school?.name,
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

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.UPDATED_TEACHER,
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
        message: `Trusity has updated the details of Teacher ${data.teacherName}`,
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
        const liveRecipients = notificationRecipients.map((teacher) => ({
          id: String(teacher.userAccountId),
          reFetchNotification: true,
        }));
        ws.sendMessage(liveRecipients);
      }
    },
  });
}
