import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface YearlyCost {
  y1: number;
  y2: number;
  y3: number;
  y4: number;
  y5: number;
}
interface Item {
  name: string;
  cost: YearlyCost;
}
interface CreateEbidtaUseCaseInput {
  data: {
    businessId: string;
    interest: Item[];
    taxes: Item[];
    ebidtaCalculation: {
      grossRevenue: YearlyCost;
      cogs: YearlyCost;
      operatingExpenses: YearlyCost;
      interest: YearlyCost;
      taxes: YearlyCost;
      netIncome: YearlyCost;
      ebit: YearlyCost;
      depreciation: YearlyCost;
      amortization: YearlyCost;
      ebitda: YearlyCost;
      ebitdaMargin: YearlyCost;
    };
  };
  user: ICurrentStudentUser;
}

export class CreateEbidtaUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: CreateEbidtaUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const actionAt = genTimestamp().iso;

    const ebidtaData = {
      taxes: data.taxes,
      interest: data.interest,
      ebidtaCalculation: data.ebidtaCalculation,
    };

    const payload = {
      businessId: data.businessId,
      ebidta: JSON.stringify([ebidtaData]),
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(payload),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        ebidtaStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    return updatedBusiness;
  }
}
