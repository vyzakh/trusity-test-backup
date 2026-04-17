import { BusinessRepository, DatabaseService, LookupRepository, SchoolAdminRepository, TeacherRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessSource, UserScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface UpdateBusinessUseCaseInput {
  data: {
    businessId: string;
    businessName?: string;
    idea?: string;
    sdgIds?: number[];
  };
  user: ICurrentStudentUser;
}

export class UpdateBusinessUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      businessRepo: BusinessRepository;
      lookupRepo: LookupRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: UpdateBusinessUseCaseInput) {
    const { logger, dbService, businessRepo, lookupRepo, ws } = this.dependencies;
    const { data, user } = input;
    const actionAt = genTimestamp().iso;

    switch (user.scope) {
      case UserScope.STUDENT: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const business = await businessRepo.getBusiness(businessQuery);
    if (!business) {
      throw new NotFoundException('The requested business could not be found.');
    }

    const businessPayload: Record<string, any> = {
      ...businessQuery,
      businessName: data.businessName,
      idea: data.idea,
      updatedAt: actionAt,
    };

    if (business.source === BusinessSource.DIRECT) {
      if (data.sdgIds && data.sdgIds.length > 0) {
        const sdgTitles = await lookupRepo.getSdgTitlesByIds({
          sdgIds: data.sdgIds,
        });

        Object.assign(businessPayload, {
          sdgsText: sdgTitles.join(', '),
        });
      }
    }

    const updatedBusiness = await businessRepo.updateBusiness(businessPayload);

    if (updatedBusiness && updatedBusiness.source === BusinessSource.DIRECT) {
      if (data.sdgIds) {
        await businessRepo.removeBusinessSdgs({
          businessId: updatedBusiness.id,
        });

        const businessSdgs = data.sdgIds.map((sdgId) => ({
          businessId: updatedBusiness.id,
          sdgId: sdgId,
        }));

        if (businessSdgs.length > 0) {
          await businessRepo.associateBusinessSdgs(businessSdgs);
        }
      }
    }

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

    return updatedBusiness;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; user: ICurrentStudentUser; data: Record<string, any>; ws: WSGateway }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      teacherRepo: new TeacherRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
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
        notificationType: NotificationType.UPDATED_BUSINESS,
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
