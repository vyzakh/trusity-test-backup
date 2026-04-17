import { BusinessRepository } from '@infrastructure/database';

interface GetBusinessPhaseStatusesUseCaseInput {
  data: { businessId: string };
}

export class GetBusinessPhaseStatusesUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}
  async execute(input: GetBusinessPhaseStatusesUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const progressStatus = await businessRepo.getBusinessProgressStatus({
      businessId: data.businessId,
    });
    if (!progressStatus) {
      return {
        innovationCompleted: false,
        entrepreneurshipCompleted: false,
        communicationCompleted: false,
      };
    }

    const innovationSteps = ['problemStatement', 'marketResearch', 'marketFit', 'prototype'];
    const entrepreneurshipSteps = ['businessModel', 'revenueModel', 'capex', 'opex', 'financialProjections', 'branding', 'marketing'];
    const communicationSteps = ['pitchDeck', 'pitchScript', 'pitchFeedback'];

    const innovationCompleted = innovationSteps.every((step) => progressStatus[step]);
    const entrepreneurshipCompleted = entrepreneurshipSteps.every((step) => progressStatus[step]);
    const communicationCompleted = communicationSteps.every((step) => progressStatus[step]);

    return {
      innovationCompleted,
      entrepreneurshipCompleted,
      communicationCompleted,
    };
  }
}
