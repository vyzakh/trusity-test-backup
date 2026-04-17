import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';

interface GetSchoolPerformanceProgressionUseCaseInput {
  data: {
    schoolId?: string;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetSchoolPerformanceProgressionUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}
  async execute(input: GetSchoolPerformanceProgressionUseCaseInput) {
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
        query.schoolId = data.schoolId;
        break;
      }
      case UserScope.TEACHER: {
        query.schoolId = data.schoolId;
        break;
      }
      case UserScope.STUDENT: {
        query.schoolId = data.schoolId;
        break;
      }
    }
    return await businessRepo.getSchoolPerformanceProgression(query);
  }
}
