import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessCompletedUseCaseInput {
  data: { businessId: string };
}

export class GetBusinessCompletedStatusUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessCompletedUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      businessId: data.businessId,
    };

    const progressStatus = await businessRepo.getBusinessProgressStatus(query);

    if (!progressStatus) return false;

    const allFieldValues = Object.values(progressStatus);

    return allFieldValues.every((value) => value === true);
  }
}
