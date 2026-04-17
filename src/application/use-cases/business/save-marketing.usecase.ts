import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface SaveMarketPlanUseCaseInput {
  data: {
    businessId: string;
    marketing: string;
    competitorAnalysis: string;
    marketingFeedback: string;
    score: number;
  };
  user: ICurrentStudentUser;
}

export class SaveMarketPlanUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: SaveMarketPlanUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const actionAt = genTimestamp().iso;

    const finalPayload = {
      businessId: data.businessId,
      marketing: data.marketing,
      competitorAnalysis: data.competitorAnalysis,
      marketingFeedback: data.marketingFeedback,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(finalPayload),
      businessRepo.updateBusinessProgressScore({
        businessId: data.businessId,
        marketPlanScore: data.score,
        updatedAt: actionAt,
      }),
      await businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        marketingStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    return updatedBusiness;
  }
}
