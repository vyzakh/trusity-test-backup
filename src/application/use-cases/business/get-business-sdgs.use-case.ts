import { BusinessRepository, ChallengeRepository } from '@infrastructure/database';
import { BusinessSource } from '@shared/enums';

interface GetBusinessSdgsUseCaseInput {
  data: { businessId: string; challengeId?: string | null; source?: BusinessSource };
}

export class GetBusinessSdgsUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; challengeRepo: ChallengeRepository }) {}

  async execute(input: GetBusinessSdgsUseCaseInput) {
    const { businessRepo, challengeRepo } = this.dependencies;
    const { data } = input;

    switch (data.source) {
      case BusinessSource.CHALLENGE: {
        if (!data.challengeId) return [];

        return await challengeRepo.findChallengeSdgs({ challengeId: data.challengeId });
      }
      case BusinessSource.DIRECT: {
        return await businessRepo.getBusinessSdgs({ businessId: data.businessId });
      }
      default: {
        return [];
      }
    }
  }
}
