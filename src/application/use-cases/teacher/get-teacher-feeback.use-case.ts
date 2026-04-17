import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetFeedbacksInput {
  data: {
    businessStep?: string;
    businessId: string;
    limit?: number;
    offset?: number;
  };
  user: ICurrentUser;
}

export class GetFeedbacksUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: GetFeedbacksInput) {
    const { data, user } = input;
    const { teacherRepo } = this.dependencies;
    const queryParams: Record<string, any> = {};

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        queryParams.businessId = data.businessId;
        break;
      }
      case UserScope.TEACHER: {
        queryParams.businessId = data.businessId;
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        queryParams.schoolId = user.schoolId;
        queryParams.businessId = data.businessId;
        break;
      }
      case UserScope.STUDENT: {
        queryParams.businessId = data.businessId;
        break;
      }
    }
    if (data.businessStep) {
      queryParams.businessStep = data.businessStep;
    }
    const feedbacks = await teacherRepo.getFeedbacks(queryParams);
    return feedbacks;
  }
}
