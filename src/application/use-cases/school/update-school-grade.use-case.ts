import { ICurrentUser } from '@core/types';
import { PlatformUserRepository, SchoolAdminRepository, SchoolRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface UpdateSchoolGradeUseCaseInput {
  data: {
    schoolId?: string;
    gradeId: number;
    sectionIds: number[];
  };
  user: ICurrentUser;
}

export class UpdateSchoolGradeUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
      platformUserRepo: PlatformUserRepository;
      notificationRepo: NotificationRepository;
      emailService: EmailService;
      ws: WSGateway;
      schoolAdminRepo: SchoolAdminRepository;
    },
  ) {}

  async execute(input: UpdateSchoolGradeUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      updatedAt: genTimestamp().iso,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    await schoolRepo.upsertSchoolGrade({
      schoolId: payload.schoolId,
      gradeId: payload.gradeId,
    });

    const schoolGradeSectionIds = await schoolRepo.getSchoolGradeSectionIds({
      schoolId: payload.schoolId,
      gradeId: payload.gradeId,
    });

    const sectionIdsToAdd = data.sectionIds.filter((sectionId) => !schoolGradeSectionIds.includes(sectionId));

    const sectionIdsToRemove = schoolGradeSectionIds.filter((schoolSectionId) => !data.sectionIds.includes(schoolSectionId));

    if (sectionIdsToAdd.length > 0) {
      const data = sectionIdsToAdd.map((sectionId) => ({
        schoolId: payload.schoolId,
        gradeId: payload.gradeId,
        sectionId,
      }));

      await schoolRepo.upsertSchoolGradeSections(data);
    }

    if (sectionIdsToRemove.length > 0) {
      await schoolRepo.deleteSchoolGradeSections({
        schoolId: payload.schoolId,
        gradeId: payload.gradeId,
        sectionIds: sectionIdsToRemove,
      });
    }
  }
}
