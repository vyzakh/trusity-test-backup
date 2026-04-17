import { BusinessLearningRepository } from '@infrastructure/database';

interface GetBusinessLearningStepsUseCaseInput {
  data: {
    gradeId: number;
    businessLearningPhaseId: number;
  };
}

export class GetBusinessLearningStepsUseCase {
  constructor(
    private readonly dependencies: {
      businessLearningRepo: BusinessLearningRepository;
    },
  ) {}

  async execute(input: GetBusinessLearningStepsUseCaseInput) {
    const { businessLearningRepo } = this.dependencies;
    const { data } = input;

    return await businessLearningRepo.getBusinessLearningSteps({
      gradeId: data.gradeId,
      businessLearningPhaseId: data.businessLearningPhaseId,
    });
  }
}
