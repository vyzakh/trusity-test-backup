import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, SchoolRepository, StudentRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { BadRequestException } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, PlatformUserRole, UserScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface DeleteStudentUseCaseInput {
  data: {
    studentId: string;
  };
  user: ICurrentUser;
}

export class DeleteStudentUseCase {
  constructor(
    private readonly dependencies: {
      userAccountRepo: UserAccountRepository;
      studentRepo: StudentRepository;
      schoolRepo: SchoolRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
      sessionRepo: SessionRepository;
      dbService:DatabaseService;
    },
  ) {}

  async execute(input: DeleteStudentUseCaseInput) {
    const { userAccountRepo, studentRepo, sessionRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      studentId: data.studentId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          accountType: BusinessModelEnum.B2B,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const student = await studentRepo.getStudent(payload);

    if (student) {
      await userAccountRepo.deleteUserAccount({
        userAccountId: student.userAccountId,
      });
      await sessionRepo.clearSession({
        userAccountId: student.userAccountId,
      });
      sendSystemNotification({
        dbService,
        ws,
        user,
        data: {
          studentName: student?.name,
          schoolId: student?.schoolId,
        },
      })
        .then(() => console.log(`System notification sent successfully for `))
        .catch((error) => console.error(`Failed to send system notification for `, error));
    }
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
        notificationType: NotificationType.DELETED_STUDENT,
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
        message: `Trusity has deleted student ${data.studentName}`,
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
