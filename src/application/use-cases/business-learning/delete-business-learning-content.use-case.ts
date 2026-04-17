import { BusinessLearningRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';

interface DeleteBusinessLearningContentUseCaseInput {
  data: {
    businessLearningContentId: number;
  };
}

export class DeleteBusinessLearningContentUseCase {
  constructor(
    private readonly dependencies: {
      businessLearningRepo: BusinessLearningRepository;
    },
  ) {}

  async execute(input: DeleteBusinessLearningContentUseCaseInput) {
    const { businessLearningRepo } = this.dependencies;
    const { data } = input;

    const itemToDelete = await businessLearningRepo.getBusinessLearningContentById(data.businessLearningContentId);

    if (!itemToDelete) {
      throw new NotFoundException('Business learning content not found');
    }

    await businessLearningRepo.deleteBusinessLearningContent({
      businessLearningContentId: data.businessLearningContentId,
    });

    await businessLearningRepo.reorderAfterDeletion(itemToDelete.businessLearningStepId, itemToDelete.sortOrder);
  }
}
