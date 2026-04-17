import { ICurrentSchoolAdminUser, ICurrentUser } from '@core/types';
import { ChallengeRepository, DatabaseService, PlatformUserRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationType } from '@shared/constants';
import { ChallengeScope, PlatformUserRole, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface HideTrusityChallengeUseCaseInput {
  data: { challengeId: string; hidden: boolean };
  user: ICurrentSchoolAdminUser;
}

export class HideTrusityChallengeUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      schoolRepo: SchoolRepository;
      dbService: DatabaseService;
      emailService: EmailService;
      ws: WSGateway;
    },
  ) {}

  async execute(input: HideTrusityChallengeUseCaseInput) {
    const { challengeRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.SCHOOL_ADMIN: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const challenge = await challengeRepo.getChallengeById({
      challengeId: data.challengeId,
      scope: ChallengeScope.TRUSITY,
    });
    if (!challenge) {
      throw new BadRequestException('This challenge was not created by the platform and cannot be hidden.');
    }

    if (data.hidden) {
      await challengeRepo.hideChallenge({
        challengeId: data.challengeId,
        schoolId: user.schoolId,
      });
    } else {
      await challengeRepo.unHideChallenge({
        challengeId: data.challengeId,
        schoolId: user.schoolId,
      });
    }
    if (user.scope === UserScope.SCHOOL_ADMIN) {
      sendSystemNotification({
        dbService,
        ws,
        user,
        data: {
          challengeName: challenge.title,
          hidden: data.hidden,
        },
      })
        .then(() => console.log(`System notification sent successfully for schooladmin: ${challenge.title}`))
        .catch((error) => console.error(`Failed to send system notification for schooladmin ${challenge.title}. Error:`, error));
    }
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentSchoolAdminUser; data: Record<string, any> }) {
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
        schoolId: user.schoolId,
      };

      const [platformUsers, school] = await Promise.all([platformUserRepo.getPlatformUsers(operationPayload), schoolRepo.getSchool(operationPayload)]);

      if (!platformUsers) {
        return;
      }

      const templatePayload: Record<string, any> = {
        schoolAdminName: user.name,
        challengeName: data.challengeName,
        schoolName: school?.name,
        hidden: data.hidden ? 'private' : 'public',
      };

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.HIDE_CHALLENGE,
      });

      if (!notificationType) {
        throw new NotFoundException('Verify the required notification type exists before attempting to create notifications.');
      }

      const notificationPayload: Record<string, any> = {
        notificationTypeId: notificationType.id,
        title: `Challenge made ${data.hidden ? 'Private' : 'Public'}`,
        message: renderTemplateString(notificationType.template, templatePayload),
        data: JSON.stringify(data),
        createdBy: user.userAccountId,
      };

      const notification = await notificationRepo.createNotification(notificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
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
