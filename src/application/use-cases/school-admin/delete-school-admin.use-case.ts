import { ICurrentPlatformUser, ICurrentSchoolAdminUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { BadRequestException, Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface DeleteSchoolAdminUseCaseInput {
  data: { schoolAdminId: string };
  user: ICurrentPlatformUser | ICurrentSchoolAdminUser;
}

export class DeleteSchoolAdminUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      schoolAdminRepo: SchoolAdminRepository;
      userAccountRepo: UserAccountRepository;
      sessionRepo: SessionRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: DeleteSchoolAdminUseCaseInput) {
    const { logger, dbService, schoolAdminRepo, userAccountRepo, sessionRepo, ws } = this.dependencies;
    const { data, user } = input;

    const schoolAdminQuery = {
      schoolAdminId: data.schoolAdminId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(schoolAdminQuery, {
          isPrimary: false,
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action');
      }
    }

    const schoolAdmin = await schoolAdminRepo.getSchoolAdminById(schoolAdminQuery);

    if (schoolAdmin) {
      await userAccountRepo.deleteUserAccount({
        userAccountId: schoolAdmin.userAccountId,
      });

      await sessionRepo.clearSession({
        userAccountId: schoolAdmin.userAccountId,
      });

      sendSystemNotification({
        dbService,
        ws,
        user,
        data: {
          schoolAdminName: schoolAdmin.name,
        },
      })
        .then(() => logger.log(`System notification sent successfully for schooladmin: ${schoolAdmin.name}`))
        .catch((error) => logger.error(`Failed to send system notification for schooladmin ${schoolAdmin.name}. Error:`, error));
    }
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentPlatformUser | ICurrentSchoolAdminUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

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

      const [platformUsers, schoolAdmins] = await Promise.all([platformUserRepo.getPlatformUsers(operationPayload), schoolAdminRepo.getSchoolAdmins(operationPayload)]);

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        schoolAdminName: data.schoolAdminName,
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
        notificationType: NotificationType.DELETED_SCHOOL_ADMIN,
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
        message: `Trusity has deleted school admin ${data.schoolAdminName}`,
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
