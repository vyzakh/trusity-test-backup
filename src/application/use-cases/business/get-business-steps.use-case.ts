import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessStepsUseCaseInput {}

export class GetBusinessStepsUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(_: GetBusinessStepsUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const result = await businessRepo.getAllSteps();
    return result;
  }
}
