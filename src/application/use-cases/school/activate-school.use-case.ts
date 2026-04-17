import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationType } from '@shared/constants';
import { PlatformUserRole, SchoolStatusAction, UserScope } from '@shared/enums';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString } from '@shared/utils';

interface ToggleSchoolActivationUseCaseInput {
  data: {
    schoolId: string;
    action: SchoolStatusAction;
  };
  user: ICurrentUser;
}

export class ToggleSchoolActivationUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
      sessionRepo: SessionRepository;
      ws: WSGateway;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      dbService: DatabaseService;
    },
  ) {}

  async execute(input: ToggleSchoolActivationUseCaseInput) {
    const { schoolRepo, sessionRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      schoolId: data.schoolId,
      updatedAt: genTimestamp().iso,
    };

    switch (data.action) {
      case SchoolStatusAction.ACTIVATE: {
        await schoolRepo.activateSchool(payload);
        break;
      }
      case SchoolStatusAction.DEACTIVATE: {
        await schoolRepo.deactivateSchool(payload);
        await sessionRepo.clearSession({ schoolId: data.schoolId });
        break;
      }
    }
    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        schoolId: data.schoolId,
        action: data.action,
      },
    })
      .then(() => console.log(`System notification sent successfully for `))
      .catch((error) => console.error(`Failed to send system notification `, error));
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
      schoolRepo: new SchoolRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo, schoolRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const [platformUsers, school] = await Promise.all([platformUserRepo.getPlatformUsers(operationPayload), schoolRepo.getSchool(operationPayload)]);

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        activation: data.action === SchoolStatusAction.ACTIVATE ? 'Enabled' : 'Disabled',
        schoolName: school?.name,
      };

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.SCHOOL_ACTIVATION,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: notificationType.title,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify({ schoolId: data.schoolId, action: data.action }),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);

      const notificationRecipients: Record<string, any>[] = [];
      const liveRecipients: { id: string; reFetchNotification: boolean }[] = [];
      const superAdmin = platformUsers.find((p) => p.role === PlatformUserRole.SUPERADMIN);

      notificationRecipients.push({
        notificationId: notification.id,
        userAccountId: superAdmin?.userAccountId,
      });
      liveRecipients.push({
        id: String(superAdmin?.userAccountId),
        reFetchNotification: true,
      });

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
      }
      ws.sendMessage(liveRecipients);
    },
  });
}
