import {
  BusinessPhaseLockRepository,
  BusinessRepository,
  ChallengeRepository,
  DatabaseService,
  LookupRepository,
  SchoolAdminRepository,
  SchoolRepository,
  TeacherRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, BusinessSource, ChallengeScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { renderTemplateString } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface CreateBusinessUseCaseInput {
  data: {
    source: BusinessSource;
    businessName: string;
    idea: string;
    challengeId?: string | null;
    sdgIds?: number[] | null;
  };
  user: ICurrentStudentUser;
}

export class CreateBusinessUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      lookupRepo: LookupRepository;
      challengeRepo: ChallengeRepository;
      businessRepo: BusinessRepository;
      businessPhaseLockRepo: BusinessPhaseLockRepository;
      schoolRepo: SchoolRepository;
      ws: WSGateway;
      emailService: EmailService;
    },
  ) {}

  async execute(input: CreateBusinessUseCaseInput) {
    const { logger, businessRepo, challengeRepo, lookupRepo, businessPhaseLockRepo, schoolRepo, ws, dbService } = this.dependencies;
    const { data, user } = input;

    let sdgIdsToUse: number[] = [];

    if (data.source === BusinessSource.CHALLENGE) {
      const challenge = await challengeRepo.getChallengeById({ challengeId: data.challengeId });

      if (!challenge) {
        throw new NotFoundException('The requested challenge could not be found.');
      }

      if (challenge.scope === ChallengeScope.SCHOOL && challenge.schoolId !== user.schoolId) {
        throw new ForbiddenException('You do not have permission to access this challenge.');
      }

      sdgIdsToUse = challenge.sdgIds || [];
    } else if (data.source === BusinessSource.DIRECT) {
      sdgIdsToUse = data.sdgIds || [];
    }

    const sdgTitles = await lookupRepo.getSdgTitlesByIds({ sdgIds: sdgIdsToUse });

    const businessData: Record<string, any> = {
      ayId: user.currentAYId,
      businessName: data.businessName,
      idea: data.idea,
      schoolId: user.schoolId,
      studentId: user.id,
      sdgsText: sdgTitles.join(', '),
    };

    switch (data.source) {
      case BusinessSource.CHALLENGE: {
        const challenge = await challengeRepo.getChallengeById({ challengeId: data.challengeId });

        if (!challenge) {
          throw new NotFoundException('The requested challenge could not be found.');
        }

        if (challenge.scope === ChallengeScope.SCHOOL) {
          if (challenge.schoolId !== user.schoolId) {
            throw new ForbiddenException('You do not have permission to access this challenge.');
          }
        }

        businessData.source = BusinessSource.CHALLENGE;
        businessData.challengeId = data.challengeId;
        break;
      }
      case BusinessSource.DIRECT: {
        businessData.source = BusinessSource.DIRECT;
        break;
      }
    }

    const business = await businessRepo.createBusiness(businessData);

    const school = await schoolRepo.getSchool({
      schoolId: user.schoolId,
    });

    if (school?.accountType === BusinessModelEnum.B2B) {
      const classLockStatus = await businessPhaseLockRepo.getPhaseLockStatusForClass({
        schoolId: user.schoolId,
        gradeId: user.gradeId,
        sectionId: user.sectionId,
        academicYearId: business.academicYearId,
      });

      if (classLockStatus.length === 0) {
        await businessPhaseLockRepo.initializeClassPhaseLocks({
          schoolId: user.schoolId,
          gradeId: user.gradeId,
          sectionId: user.sectionId,
          academicYearId: business.academicYearId,
        });
      }

      await businessPhaseLockRepo.upsertBusinessPhaseLockFromClass({
        studentId: user.id,
        academicYearId: business.academicYearId,
      });
    } else {
      await businessPhaseLockRepo.upsertBusinessPhaseLockFromB2CDefault({
        studentId: user.id,
        academicYearId: business.academicYearId,
      });
    }

    if (business.source === BusinessSource.DIRECT) {
      if (data.sdgIds) {
        const businessSdgs = data.sdgIds.map((sdgId) => {
          return {
            businessId: business.id,
            sdgId: sdgId,
          };
        });

        if (businessSdgs.length > 0) {
          await businessRepo.associateBusinessSdgs(businessSdgs);
        }
      }
    }

    await Promise.all([
      businessRepo.createBusinessProgressScore({ businessId: business.id, schoolId: user.schoolId, studentId: user.id }),
      businessRepo.createBusinessProgressStatus({ businessId: business.id, schoolId: user.schoolId, studentId: user.id }),
    ]);

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

    return business;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; user: ICurrentStudentUser; data: Record<string, any>; ws: WSGateway }) {
  const { dbService, user, data, ws } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      schoolAdminRepo: new SchoolAdminRepository(db),
      teacherRepo: new TeacherRepository(db),
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
        notificationType: NotificationType.CREATED_BUSINESS,
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
