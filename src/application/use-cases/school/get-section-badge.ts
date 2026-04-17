import { ICurrentUser } from '@core/types';
import { BadgeRepository, BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface GetSectionBadgeUseCaseInput {
  data: {
    academicYearId?: string;
    schoolId: string;
    gradeId: number;
    sectionId: number;
  };
  user: ICurrentUser;
}

export class GetSectionBadgeUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; badgeRepo: BadgeRepository }) {}

  async execute(input: GetSectionBadgeUseCaseInput) {
    const { businessRepo, badgeRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      schoolId: data.schoolId,
      academicYearId: data.academicYearId,
    };

    switch (user.scope) {
      case UserScope.STUDENT: {
        query.studentId = user.id;
        query.schoolId = user.schoolId;
        query.gradeId = user.gradeId;
        query.sectionId = user.sectionId;
        query.academicYearId = user.currentAYId;
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

    const overallSectionScore = await businessRepo.getOverallSectionScore(query);

    if (!overallSectionScore) return null;

    const badge = await badgeRepo.getBadgeByScore({
      score: overallSectionScore,
    });

    return {
      badge,
      badgeScore: overallSectionScore,
    };
  }
}
