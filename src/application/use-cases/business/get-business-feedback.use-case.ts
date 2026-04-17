import { AiPerformanceFeedbackService } from '@application/services';
import { ICurrentUser } from '@core/types';
import { AiPerformanceFeedbackRepository } from '@infrastructure/database/repositories/ai-performance-feedback.repository';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetBusinessAiPerformanceFeedbackUseCaseInput {
  data: {
    businessId: string;
  };
  user: ICurrentUser;
}

export class GetBusinessAiPerformanceFeedbackUseCase {
  constructor(private readonly deps: { aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository; aiPerformanceFeedbackService: AiPerformanceFeedbackService }) {}

  async execute(input: GetBusinessAiPerformanceFeedbackUseCaseInput) {
    const { aiPerformanceFeedbackService, aiPerformanceFeedbackRepo } = this.deps;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const payload = {
      businessId: data.businessId,
    };

    const { success, ...feedback } = await aiPerformanceFeedbackService.getBusinessFeedback(payload);

    const createdFeedback = await aiPerformanceFeedbackRepo.createFeedback({
      feedback: JSON.stringify(feedback),
    });

    return { ...feedback, feedbackId: createdFeedback.id };
  }
}
