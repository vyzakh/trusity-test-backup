import { getCurrentAcademicYear } from '@application/common';
import { ICurrentUser } from '@core/types';
import { DatabaseService, LookupRepository, PlatformUserRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString, sanitizeInput } from '@shared/utils';

interface CreateSchoolUseCaseInput {
  data: {
    name: string;
    accountType: BusinessModelEnum;
    academicBaseYear?: number | null;
    academicStartMonth?: number | null;
    academicEndMonth?: number | null;
    promotionStartMonth?: number | null;
    promotionStartDay?: number | null;
    totalLicense?: number;
    licenseExpiry?: Date | null;
    curriculums?: {
      id: number;
      name?: string | null;
    }[];
    address?: {
      countryId?: string | null;
      streetAddressLine1?: string | null;
      streetAddressLine2?: string | null;
      cityId?: string | null;
      stateId?: string | null;
      postalCode?: string | null;
      contactNumber?: string | null;
    };
    principalName?: string | null;
    contact?: {
      name: string | null;
      contactNumber: string | null;
      email: string | null;
    };
    logoUrl?: string | null;
  };
  user: ICurrentUser;
}

export class CreateSchoolUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      lookupRepo: LookupRepository;
      schoolRepo: SchoolRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: CreateSchoolUseCaseInput) {
    const { logger, dbService, lookupRepo, schoolRepo, ws } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const payload = {
      name: sanitizeInput(data.name),
      accountType: data.accountType,
      academicBaseYear: data.academicBaseYear,
      academicStartMonth: data.academicStartMonth,
      academicEndMonth: data.academicEndMonth,
      promotionStartMonth: data.promotionStartMonth,
      promotionStartDay: data.promotionStartDay,
      logoUrl: sanitizeInput(data.logoUrl),
      countryId: data.address?.countryId,
      stateId: data.address?.stateId,
      cityId: data.address?.cityId,
      streetAddressLine1: sanitizeInput(data.address?.streetAddressLine1),
      streetAddressLine2: sanitizeInput(data.address?.streetAddressLine2),
      postalCode: sanitizeInput(data.address?.postalCode),
      addressContactNumber: sanitizeInput(data.address?.contactNumber),
      principalName: sanitizeInput(data.principalName),
      pocName: sanitizeInput(data.contact?.name),
      pocContactNumber: sanitizeInput(data.contact?.contactNumber),
      pocEmail: sanitizeInput(data.contact?.email),
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    if (data.accountType === BusinessModelEnum.B2B) {
      Object.assign(payload, {
        totalLicense: data.totalLicense,
        licenseExpiry: data.licenseExpiry,
      });
    }

    const school = await schoolRepo.createSchool(payload);

    if (data.accountType === BusinessModelEnum.B2B) {
      const schoolCurriculums = (data.curriculums || []).map((curriculum) => ({
        schoolId: school.id,
        curriculumId: curriculum.id,
        curriculumName: sanitizeInput(curriculum.name),
      }));

      if (schoolCurriculums.length > 0) {
        await schoolRepo.associateSchoolCurriculums(schoolCurriculums);
      }
    }

    if (data.accountType === BusinessModelEnum.B2C) {
      const grades = await lookupRepo.findAllGrades();
      const sections = await lookupRepo.findAllSections();

      for (const grade of grades) {
        await schoolRepo.upsertSchoolGrade({
          schoolId: school.id,
          gradeId: grade.id,
        });
        const schoolSections = sections.map((section) => ({
          schoolId: school.id,
          gradeId: grade.id,
          sectionId: section.id,
        }));
        await schoolRepo.upsertSchoolSections(schoolSections);
      }
    }

    if (school.academicStartMonth && school.academicEndMonth && school.academicBaseYear) {
      const generatedAcademicYear = getCurrentAcademicYear({
        startMonth: school.academicStartMonth,
        endMonth: school.academicEndMonth,
        baseYear: school.academicBaseYear,
      });

      const academicYear = await schoolRepo.upsertAcademicYear({
        schoolId: school.id,
        startYear: generatedAcademicYear.startYear,
        endYear: generatedAcademicYear.endYear,
        startDate: generatedAcademicYear.startDate,
        endDate: generatedAcademicYear.endDate,
      });

      await schoolRepo.updateSchool({
        schoolId: school.id,
        currentAYId: academicYear.id,
        updatedAt: actionAt,
      });

      Object.assign(school, {
        currentAYId: academicYear.id,
      });
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        schoolName: school.name,
      },
    })
      .then(() => logger.log(`System notification sent successfully for schooladmin: ${school.name}`))
      .catch((error) => logger.error(`Failed to send system notification for schooladmin ${school.name}. Error:`, error));

    return school;
  }
}

async function sendSystemNotification(input: { dbService: DatabaseService; ws: WSGateway; user: ICurrentUser; data: Record<string, any> }) {
  const { dbService, ws, user, data } = input;

  await dbService.runUnitOfWork({
    useTransaction: true,
    buildDependencies: async ({ db }) => ({
      notificationRepo: new NotificationRepository(db),
      platformUserRepo: new PlatformUserRepository(db),
    }),
    callback: async ({ platformUserRepo, notificationRepo }) => {
      const operationPayload: Record<string, any> = {
        excludeUserAccountIds: [user.userAccountId],
      };

      const platformUsers = await platformUserRepo.getPlatformUsers(operationPayload);

      const templatePayload: Record<string, any> = {
        userAccountName: user.name,
        schoolName: data.schoolName,
        scopeName: 'Trusity',
      };

      const notificationType = await notificationRepo.getNotificationType({
        notificationType: NotificationType.CREATED_SCHOOL,
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

      platformUsers.forEach((platformUser) => {
        notificationRecipients.push({
          notificationId: notification.id,
          userAccountId: platformUser.userAccountId,
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
