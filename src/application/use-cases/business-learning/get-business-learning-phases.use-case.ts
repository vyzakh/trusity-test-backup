import { BusinessLearningRepository } from '@infrastructure/database';

interface GetBusinessLearningPhasesUseCaseInput {
  data: {};
}

export class GetBusinessLearningPhasesUseCase {
  constructor(
    private readonly dependencies: {
      businessLearningRepo: BusinessLearningRepository;
    },
  ) {}

  async execute(_: GetBusinessLearningPhasesUseCaseInput) {
    const { businessLearningRepo } = this.dependencies;

    return await businessLearningRepo.getBusinessLearningPhases();
  }
}
