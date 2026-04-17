import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolAdminRepository, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString, sanitizeInput } from '@shared/utils';

interface UpdateSchoolAdminUseCaseInput {
  data: {
    schoolAdminId?: string;
    name?: string;
    email?: string;
    contactNumber?: string | null;
    avatarUrl?: string | null;
  };
  user: ICurrentUser;
}

export class UpdateSchoolAdminUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      schoolAdminRepo: SchoolAdminRepository;
      userAccountRepo: UserAccountRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: UpdateSchoolAdminUseCaseInput) {
    const { logger, dbService, schoolAdminRepo, userAccountRepo, ws } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const payload: Record<string, any> = {
      schoolAdminId: data.schoolAdminId,
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
        Object.assign(payload, {
          schoolId: user.schoolId,
          isPrimary: false,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const schoolAdmin = await schoolAdminRepo.getSchoolAdmin({
      schoolAdminId: payload.schoolAdminId,
      schoolId: payload.schoolId,
      isPrimary: payload.isPrimary,
    });

    const updatedSchoolAdmin = await schoolAdminRepo.updateSchoolAdmin(payload);

    if (updatedSchoolAdmin) {
      if (data.email) {
        await userAccountRepo.updateUserAccount({
          userAccountId: updatedSchoolAdmin.userAccountId,
          email: updatedSchoolAdmin.email,
        });
      }
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        schoolAdminName: schoolAdmin?.name,
      },
    })
      .then(() => logger.log(`System notification sent successfully for schooladmin: ${schoolAdmin?.name}`))
      .catch((error) => logger.error(`Failed to send system notification for schooladmin ${schoolAdmin?.name}. Error:`, error));

    return updatedSchoolAdmin;
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
        notificationType: NotificationType.UPDATED_SCHOOL_ADMIN,
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
        message: `Trusity has updated the details of School Admin ${data.schoolAdminName}`,
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
