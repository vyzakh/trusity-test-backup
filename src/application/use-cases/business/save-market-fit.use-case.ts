import { BusinessRepository } from '@infrastructure/database';
import { genTimestamp } from '@shared/utils';

interface SaveMarketFitUseCaseInput {
  data: {
    businessId: string;
    isReviewed: boolean;
  };
}

export class SaveMarketFitUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: SaveMarketFitUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const actionAt = genTimestamp().iso;

    const business = await businessRepo.updateBusiness({
      businessId: data.businessId,
      isIdeaReviewed: data.isReviewed,
      updatedAt: actionAt,
    });

    if (data.isReviewed) {
      await businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        marketFitStatus: true,
        updatedAt: actionAt,
      });
    }

    return business;
  }
}
