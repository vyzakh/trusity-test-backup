import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface Input {
  businessId: string;
  callToAction: string;
}

export class SaveStudentPitchDeckkUseCase {
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
      callToAction: input.callToAction ?? '',
      updatedAt: actionAt,
    };

    const updatedBusiness = await businessRepo.updateBusiness(updateBusinessPayload);
    if (!updatedBusiness || updatedBusiness === null) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }
    const updateBusinessProgressStatusPayload: Record<string, any> = {
      businessId: parseInt(input.businessId),
      pitchDeck: true,
      updatedAt: actionAt,
    };
    await businessRepo.updateBusinessProgressStatus(updateBusinessProgressStatusPayload);
    const pitchDeckData = {
      businessId: String(updatedBusiness.id ?? input.businessId),
      callToAction: updatedBusiness.callToAction,
    };

    return pitchDeckData;
  }
}
