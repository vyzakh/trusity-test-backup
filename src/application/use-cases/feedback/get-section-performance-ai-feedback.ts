import { AiPerformanceFeedbackService } from '@application/services';
import { ICurrentUser } from '@core/types';
import { AiPerformanceFeedbackRepository, BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSectionPerformanceAiFeedbackUseCaseInput {
  data: {
    schoolId: string;
    gradeId: number;
    sectionId: number;
    status?: BusinessStatus;
  };
  user: ICurrentUser;
}

export class GetSectionPerformanceAiFeedbackUseCase {
  constructor(
    private readonly deps: {
      businessRepo: BusinessRepository;
      aiPerformanceFeedbackService: AiPerformanceFeedbackService;
      aiPerformanceFeedbackRepo: AiPerformanceFeedbackRepository;
    },
  ) {}

  async execute(input: GetSectionPerformanceAiFeedbackUseCaseInput) {
    const payload = {
      schoolId: input.data.schoolId,
      gradeId: input.data.gradeId,
      sectionId: input.data.sectionId,
      status: input.data.status,
    };

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        Object.assign(payload, { schoolId: input.user.schoolId });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const sectionPerformanceProgression = await this.deps.businessRepo.getSectionPerformanceProgression(payload);
    console.log(sectionPerformanceProgression)

    if (!sectionPerformanceProgression) {
      return null;
    }

    const { feedback } = await this.deps.aiPerformanceFeedbackService.getSectionFeedback({
      scores: sectionPerformanceProgression,
    });

    const { id } = await this.deps.aiPerformanceFeedbackRepo.createFeedback({
      feedback,
    });

    return { feedback, feedbackId: id };
  }
}
