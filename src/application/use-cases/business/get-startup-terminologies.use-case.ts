import { BusinessRepository } from '@infrastructure/database';
interface GetStartupTerminologiesUseCaseInput {
  data: { category: string };
}
export class GetStartupTerminologiesUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetStartupTerminologiesUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    return await businessRepo.getStartupTerminologies(data);
  }
}
