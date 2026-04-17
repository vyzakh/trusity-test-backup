import { BusinessLearningRepository } from '@infrastructure/database';

interface GetBusinessLearningContentsUseCaseInput {
  data: {
    stepId?: number;
    phaseCode?: string;
    stepCode?: string;
    gradeId?: number;
  };
}

export class GetBusinessLearningContentsUseCase {
  constructor(
    private readonly dependencies: {
      businessLearningRepo: BusinessLearningRepository;
    },
  ) {}

  async execute(input: GetBusinessLearningContentsUseCaseInput) {
    const { businessLearningRepo } = this.dependencies;
    const { data } = input;

    return await businessLearningRepo.getBusinessLearningContents({
      gradeId: data.gradeId,
      stepId: data.stepId,
      phaseCode: data.phaseCode,
      stepCode: data.stepCode,
    });
  }
}
