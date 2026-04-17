import { BusinessRepository } from '@infrastructure/database';

export class GetBusinessModelQuestionsUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute() {
    const { businessRepo } = this.dependencies;

    return await businessRepo.getBusinessModelQuestions({ isVisible: true });
  }
}
