import { ICurrentStudentUser, ICurrentUser } from '@core/types';
import { BusinessRepository, DatabaseService, SchoolAdminRepository, TeacherRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { NotificationType } from '@shared/constants';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString } from '@shared/utils';

interface SaveLaunchUseCaseInput {
  data: {
    businessId: string;
    launchStrategy: string;
  };
  user: ICurrentStudentUser;
}

export class SaveLaunchUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; dbService: DatabaseService; ws: WSGateway }) {}

  async execute(input: SaveLaunchUseCaseInput) {
    const { businessRepo, dbService, ws } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const updatedBusiness = await businessRepo.updateBusiness({
      businessId: data.businessId,
      launchStrategy: data.launchStrategy,
      updatedAt: actionAt,
    });

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    const updateBusinessProgressStatusPayload: Record<string, any> = {
      businessId: updatedBusiness.id,
      launch: true,
      updatedAt: actionAt,
    };

    await businessRepo.updateBusinessProgressStatus(updateBusinessProgressStatusPayload);

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        businessName: updatedBusiness.businessName,
      },
    })
      .then(() => console.log(`System notification sent successfully for challenge: ${updatedBusiness.businessName}`))
      .catch((error) => console.error(`Failed to send system notification for challenge ${updatedBusiness.businessName}. Error:`, error));
    return updatedBusiness;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      teacherRepo: new TeacherRepository(db),
    }),
    callback: async ({ notificationRepo, schoolAdminRepo, teacherRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
        schoolId: data.schoolId,
      };

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        businessName: data.businessName,
      };

      const [schoolAdmins, teachers] = await Promise.all([schoolAdminRepo.getSchoolAdmins(operationPayload), teacherRepo.getTeachers(operationPayload)]);

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.COMPLETED_BUSINESS,
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

      const notification = await notificationRepo.createNotification(notificationPayload);

      const notificationRecipients: Record<string, any>[] = [];

      teachers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
        });
      });

      schoolAdmins.forEach((schoolAdmin) => {
        notificationRecipients.push({
          notificationId: notification.id,
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
