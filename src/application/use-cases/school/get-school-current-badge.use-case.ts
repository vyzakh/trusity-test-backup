import { ICurrentUser } from '@core/types';
import { BadgeRepository, BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

interface GetSchoolCurrentBadgeUseCaseInput {
  data: {
    schoolId: string;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetSchoolCurrentBadgeUseCase {
  constructor(private readonly dependencies: { badgeRepo: BadgeRepository; businessRepo: BusinessRepository }) {}

  async execute(input: GetSchoolCurrentBadgeUseCaseInput) {
    const { badgeRepo, businessRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      academicYearId: data.academicYearId,
    };

    if (!isDefinedStrict(data.academicYearId)) {
      Object.assign(query, {
        enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (user.scope) {
      case UserScope.STUDENT: {
        query.studentId = user.id;
        query.academicYearId = data.academicYearId ?? user.currentAYId;
        break;
      }
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        query.schoolId = user.schoolId;
        break;
      }
      case UserScope.TEACHER: {
        query.schoolId = user.schoolId;
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const overallSchoolScore = await businessRepo.getOverallSchoolScore(query);

    if (!overallSchoolScore) return null;

    const badge = await badgeRepo.getBadgeByScore({
      score: overallSchoolScore,
    });

    return {
      badge,
      badgeScore: overallSchoolScore,
    };
  }
}
