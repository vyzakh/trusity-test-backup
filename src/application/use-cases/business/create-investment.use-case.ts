import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
export interface CreateInvestmentInput {
  data: {
    businessId: string;
    amount: string;
    purpose: string;
    valueEdge: {
      fundCase: string;
    };
    fundGoals: {
      goal: string;
      cost: string;
      outcome: string;
    }[];
    fundPlan: {
      amount: string;
      description: string;
      importance: string;
    }[];
    fundSource: {
      source: string;
    };
    nextStep: {
      actionItem: string;
      step: string;
      due: string;
    }[];
    fundPitchStatement: {
      pitchStatement: string;
    };
  };
}

export class CreateInvestmentUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: CreateInvestmentInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;
    const actionAt = genTimestamp().iso;

    const updatedBusiness = await businessRepo.updateBusiness({
      businessId: data.businessId,
      investment: data,
      updatedAt: actionAt,
    });

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    const updateBusinessProgressStatusPayload: Record<string, any> = {
      businessId: parseInt(data.businessId),
      investment: true,
      updatedAt: actionAt,
    };
    await businessRepo.updateBusinessProgressStatus(updateBusinessProgressStatusPayload);

    return updatedBusiness;
  }
}
