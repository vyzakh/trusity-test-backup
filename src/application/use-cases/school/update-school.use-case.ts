import { getCurrentAcademicYear } from '@application/common';
import { ICurrentUser } from '@core/types';
import { DatabaseService, PlatformUserRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { NotificationType } from '@shared/constants';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, renderTemplateString, sanitizeInput } from '@shared/utils';

interface UpdateSchoolUseCaseInput {
  data: {
    schoolId?: string | null;
    name?: string;
    accountType: BusinessModelEnum;
    curriculums?: {
      id: number;
      name?: string | null;
    }[];
    academicStartMonth?: number | null;
    academicEndMonth?: number | null;
    promotionStartMonth?: number | null;
    promotionStartDay?: number | null;
    totalLicense?: number;
    licenseExpiry?: Date | null;
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
      name?: string | null;
      contactNumber?: string | null;
      email?: string | null;
    };
    logoUrl?: string | null;
  };
  user: ICurrentUser;
}

export class UpdateSchoolUseCase {
  constructor(
    private readonly dependencies: {
      logger: Logger;
      dbService: DatabaseService;
      schoolRepo: SchoolRepository;
      ws: WSGateway;
    },
  ) {}

  async execute(input: UpdateSchoolUseCaseInput) {
    const { logger, dbService, schoolRepo, ws } = this.dependencies;
    const { data, user } = input;
    const actionAt = genTimestamp().iso;

    const payload = {
      schoolId: data.schoolId,
      accountType: data.accountType,
      academicStartMonth: data.academicStartMonth,
      academicEndMonth: data.academicEndMonth,
      promotionStartMonth: data.promotionStartMonth,
      promotionStartDay: data.promotionStartDay,
      updatedAt: actionAt,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(payload, {
          name: sanitizeInput(data.name),
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
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          logoUrl: sanitizeInput(data.logoUrl),
          pocName: sanitizeInput(data.contact?.name),
          pocContactNumber: sanitizeInput(data.contact?.contactNumber),
          pocEmail: sanitizeInput(data.contact?.email),
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    switch (data.accountType) {
      case BusinessModelEnum.B2B: {
        Object.assign(payload, {
          totalLicense: data.totalLicense,
          licenseExpiry: data.licenseExpiry,
        });
        break;
      }
      case BusinessModelEnum.B2C: {
        break;
      }
      default: {
        throw new BadRequestException('Unhandled error: An unknown or uninitialized data type was encountered.');
      }
    }

    const updatedSchool = await schoolRepo.updateSchool(payload);

    if (!updatedSchool) {
      throw new NotFoundException('school not found for the provided ID');
    }

    if (updatedSchool) {
      if (updatedSchool.accountType === BusinessModelEnum.B2B) {
        if (data.curriculums) {
          const schoolCurriculums = data.curriculums.map((curriculum) => ({
            schoolId: updatedSchool.id,
            curriculumId: curriculum.id,
            curriculumName: sanitizeInput(curriculum.name),
          }));

          await schoolRepo.deleteSchoolCurriculums({
            schoolId: updatedSchool.id,
          });

          if (schoolCurriculums.length > 0) {
            await schoolRepo.associateSchoolCurriculums(schoolCurriculums);
          }
        }
      }

      if (payload.academicStartMonth && payload.academicEndMonth) {
        const generatedAcademicYear = getCurrentAcademicYear({
          startMonth: payload.academicStartMonth,
          endMonth: payload.academicEndMonth,
          baseYear: updatedSchool.academicBaseYear,
        });

        const academicYear = await schoolRepo.upsertAcademicYear({
          schoolId: updatedSchool.id,
          startYear: generatedAcademicYear.startYear,
          endYear: generatedAcademicYear.endYear,
          startDate: generatedAcademicYear.startDate,
          endDate: generatedAcademicYear.endDate,
        });

        if (academicYear.id !== updatedSchool.currentAYId) {
          await schoolRepo.updateSchool({
            schoolId: updatedSchool.id,
            currentAYId: academicYear.id,
            updatedAt: actionAt,
          });

          Object.assign(updatedSchool, {
            currentAYId: academicYear.id,
          });
        }
      }
    }

    sendSystemNotification({
      dbService,
      ws,
      user,
      data: {
        schoolName: updatedSchool.name,
      },
    })
      .then(() => logger.log(`System notification sent successfully for school: ${updatedSchool.name}`))
      .catch((error) => logger.error(`Failed to send system notification for school ${updatedSchool.name}. Error:`, error));

    return updatedSchool;
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
        notificationType: NotificationType.UPDATED_SCHOOL,
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
