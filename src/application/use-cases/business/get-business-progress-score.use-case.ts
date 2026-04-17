import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessProgressScoreUseCaseInput {
  data: { businessId: string };
}

export class GetBusinessProgressScoreUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessProgressScoreUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      businessId: data.businessId,
    };

    return await businessRepo.getBusinessProgressScore(query);
  }
}
