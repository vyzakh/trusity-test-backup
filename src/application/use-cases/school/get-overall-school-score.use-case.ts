import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { normalizeNumber } from '@shared/utils/common.util';

interface GetOverallSchoolScoreUseCaseInput {
  data: {
    schoolId?: string;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetOverallSchoolScoreUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetOverallSchoolScoreUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      status: data.status,
    };

    switch (user.scope) {
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
      case UserScope.STUDENT: {
        query.schoolId = user.schoolId;
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const score = await businessRepo.getOverallSchoolScore(query);

    return normalizeNumber(score);
  }
}
