import { BusinessRepository } from '@infrastructure/database';
import { BusinessModelEnum } from '@shared/enums';

interface GetBusinessAverageScoresUseCaseInput {
  data: {
    businessId?: string;
    schoolId?: string;
    countryId?: string;
    businessType?: BusinessModelEnum;
  };
}

export class GetBusinessAverageScoresUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessAverageScoresUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const businessQuery = {
      businessId: data.businessId,
      schoolId: data.schoolId,
      countryId: data.countryId,
      accountType: data.businessType,
    };

    const { avgIScore, avgEScore, avgCScore } = await businessRepo.getBusinessesAverageScores(businessQuery);

    return {
      avgIScore: avgIScore,
      avgEScore: avgEScore,
      avgCScore: avgCScore,
      averageScore: (avgIScore + avgEScore + avgCScore) / 3,
    };
  }
}
