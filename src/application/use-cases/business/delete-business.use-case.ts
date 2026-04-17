import { ICurrentStudentUser } from '@core/types';
import { BusinessRepository, DatabaseService, SchoolAdminRepository, TeacherRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';

interface DeleteBusinessUseCaseInput {
  data: { businessId: string };
  user: ICurrentStudentUser;
}

export class DeleteBusinessUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      businessRepo: BusinessRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: DeleteBusinessUseCaseInput) {
    const { logger, dbService, businessRepo, ws } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({
      businessId: data.businessId,
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // if (business.status !== BusinessStatus.IN_PROGRESS) {
    //   throw new ForbiddenException('Business can only be deleted when status is in progress');
    // }

    const query: Record<string, any> = {
      businessId: data.businessId,
      studentId: user.id,
    };
    await businessRepo.deleteBusiness(query);

    sendSystemNotification({
      dbService,
      user,
      data: {
        businessName: business.businessName,
      },
      ws: ws,
    })
      .then(() => logger.log(`System notification sent successfully for business: ${business.businessName}`))
      .catch((error) => logger.error(`Failed to send system notification for business ${business.businessName}. Error:`, error));
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; user: ICurrentStudentUser; data: Record<string, any>; ws: WSGateway }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      teacherRepo: new TeacherRepository(db),
      schoolAdminRepo:new SchoolAdminRepository(db)
    }),
    callback: async ({ notificationRepo, teacherRepo, schoolAdminRepo }) => {
      const operationPayload: Record<string, any> = {
        schoolId: user.schoolId,
        gradeId: user.gradeId,
        sectionId: user.sectionId,
      };

      const templatePayload: Record<string, any> = {
        studentName: user.name,
        businessName: data.businessName,
      };

      const teachers = await teacherRepo.getTeachers(operationPayload);
      const schoolAdmins = await schoolAdminRepo.getSchoolAdmins(operationPayload);
      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.DELETED_BUSINESS,
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
      const liveRecipients: any = [];
      teachers.forEach((teacher) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: teacher.userAccountId,
        });
        liveRecipients.push({ id: String(teacher.userAccountId), reFetchNotification: true });
      });

      schoolAdmins.forEach((sa) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: sa.userAccountId,
        });
        liveRecipients.push({ id: String(sa.userAccountId), reFetchNotification: true });
      });

      if (notificationRecipients.length > 0) {
        await notificationRepo.crateNotificationRecipients(notificationRecipients);
      }
      ws.sendMessage(liveRecipients);
    },
  });
}
