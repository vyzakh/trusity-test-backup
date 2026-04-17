import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface Input {
  businessId: string;
  videoUrl: string;
  aiGeneratedFeedback: string;
  score: number;
}

export class SaveStudentPitchPracticeAndFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: Input) {
    const { businessRepo } = this.dependencies;

    const actionAt = genTimestamp().iso;

    const updateBusinessPayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      pitchPracticeVideoUrl: input.videoUrl ?? '',
      pitchAiGeneratedFeedback: input.aiGeneratedFeedback ?? '',
      updatedAt: actionAt,
    };

    const updateBusinessProgressStatusPayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      pitchFeedback: true,
      updatedAt: actionAt,
    };

    const updateBusinessProgressScorePayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      pitchFeedbackScore: input.score ?? 0,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(updateBusinessPayload),
      businessRepo.updateBusinessProgressStatus(updateBusinessProgressStatusPayload),
      businessRepo.updateBusinessProgressScore(updateBusinessProgressScorePayload),
    ]);

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    return {
      id: String(updatedBusiness.id ?? input.businessId),
      businessId: String(updatedBusiness.id ?? input.businessId),
      pitchPracticeVideoUrl: input.videoUrl,
      pitchAiGeneratedFeedback: input.aiGeneratedFeedback,
      score: input.score,
      updatedAt: actionAt,
    };
  }
}
