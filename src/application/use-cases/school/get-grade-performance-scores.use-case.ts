import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetGradePerformanceScoreUseCaseInput {
  data: {
    schoolId?: string;
    gradeId: number;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetGradePerformanceScoreUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetGradePerformanceScoreUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
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

    const scores = await businessRepo.getGradePerformanceScores(query);
    return scores;
  }
}
