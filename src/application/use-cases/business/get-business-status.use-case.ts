import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessStatusUseCaseInput {
  data: {
    businessId: string;
  };
}

export class GetBusinessStatusUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessStatusUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      businessId: data.businessId,
    };

    return await businessRepo.getBusinessStatus(query);
  }
}
