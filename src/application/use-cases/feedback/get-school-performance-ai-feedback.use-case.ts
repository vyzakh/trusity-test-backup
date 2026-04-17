import { AiPerformanceFeedbackService } from '@application/services';
import { ICurrentUser } from '@core/types';
import { AiPerformanceFeedbackRepository, BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSchoolPerformanceAiFeedbackUseCaseInput {
  data: {
    schoolId: string;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetSchoolPerformanceAiFeedbackUseCase {
  constructor(
    private readonly deps: {
      businessRepo: BusinessRepository;
      aiPerformanceFeedbackService: AiPerformanceFeedbackService;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: GetSchoolPerformanceAiFeedbackUseCaseInput) {
    const payload = {
      schoolId: input.data.schoolId,
      status: input.data.status
    };

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const schoolPerformanceProgression = await this.deps.businessRepo.getSchoolPerformanceProgression(payload);

    if (!schoolPerformanceProgression) {
      return null;
    }

    const { feedback } = await this.deps.aiPerformanceFeedbackService.getSchoolFeedback({
      scores: schoolPerformanceProgression,
    });

    const { id } = await this.deps.aiPerformanceFeedbackRepo.createFeedback({
      feedback,
    });

    return { feedback, feedbackId: id };
  }
}
