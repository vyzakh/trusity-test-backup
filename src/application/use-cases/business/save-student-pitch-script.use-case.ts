import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface Input {
  businessId: string;
  narrative: string;
  pitchDescription: string;
  aiGeneratedScript: string;
}

export class SaveStudentPitchScriptUseCase {
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
      narrative: sanitizeInput(input.narrative),
      pitchDescription: sanitizeInput(input.pitchDescription),
      aiGeneratedScript: input.aiGeneratedScript ?? '',
      updatedAt: actionAt,
    };

    const updateBusinessProgressStatusPayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      pitchScript: true,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(updateBusinessPayload),
      businessRepo.updateBusinessProgressStatus(updateBusinessProgressStatusPayload),
    ]);

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    return updatedBusiness;
  }
}
