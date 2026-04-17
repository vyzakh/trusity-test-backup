import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetClassPerformanceProgressionUseCaseInput {
  data: {
    schoolId?: string;
    gradeId: number;
    sectionId: number;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetClassPerformanceProgressionUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetClassPerformanceProgressionUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
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

    return await businessRepo.getSectionPerformanceProgression(query);
  }
}
