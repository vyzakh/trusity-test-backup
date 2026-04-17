import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessProgressStatusUseCaseInput {
  data: { businessId: string };
}

export class GetBusinessProgressStatusUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessProgressStatusUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      businessId: data.businessId,
    };

    return await businessRepo.getBusinessProgressStatus(query);
  }
}
