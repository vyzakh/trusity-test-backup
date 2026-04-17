import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { normalizeNumber } from '@shared/utils/common.util';

interface GetOverallGradeScoreUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    gradeIds?: number[];
    sectionIds?: number[];
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetOverallGradeScoreUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetOverallGradeScoreUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const baseQuery: Record<string, any> = {
      status: data.status,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        baseQuery.schoolId = data.schoolId;
        break;

      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT:
        baseQuery.schoolId = user.schoolId;
        break;

      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (data.gradeIds?.length) {

      const { ogs } = await businessRepo.getOverallGradeScoreByGradeIds({
        ...baseQuery,
        gradeIds: data.gradeIds,
      });

      return normalizeNumber(ogs);
    }

    const score = await businessRepo.getOverallGradeScore({
      ...baseQuery,
      gradeId: data.gradeId,
      sectionIds: data.sectionIds,
    });

    return normalizeNumber(score);
  }
}
