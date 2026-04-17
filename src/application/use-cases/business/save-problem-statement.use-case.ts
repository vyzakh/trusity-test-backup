import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface SaveProblemStatementUseCaseInput {
  data: {
    businessId: string;
    problemStatement: string;
  };
}

export class SaveProblemStatementUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: SaveProblemStatementUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const actionAt = genTimestamp().iso;

    const updatedBusiness = await businessRepo.updateBusiness({
      businessId: data.businessId,
      problemStatement: data.problemStatement,
      updatedAt: actionAt,
    });

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    await businessRepo.updateBusinessProgressStatus({
      businessId: data.businessId,
      problemStatementStatus: true,
      updatedAt: actionAt,
    });

    return updatedBusiness;
  }
}
