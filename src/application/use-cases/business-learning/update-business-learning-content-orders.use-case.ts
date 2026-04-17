import { BusinessLearningRepository } from '@infrastructure/database';

interface UpdateBusinessLearningContentOrdersUseCaseInput {
  data: { businessLearningContentId: number; sortOrder: number }[];
}

export class UpdateBusinessLearningContentOrdersUseCase {
  constructor(private readonly dependencies: { businessLearningRepo: BusinessLearningRepository }) {}

  async execute(input: UpdateBusinessLearningContentOrdersUseCaseInput) {
    const { businessLearningRepo } = this.dependencies;
    const { data } = input;

    await businessLearningRepo.updateBusinessLearningContentOrders({
      contentOrders: data,
    });
  }
}
