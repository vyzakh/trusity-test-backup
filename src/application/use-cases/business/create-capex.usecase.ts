import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';

interface CreateCapexUseCaseInput {
  data: {
    businessId: string;
    capex: {
      name: string;
      cost: number;
    }[];
  };
  user: ICurrentStudentUser;
}
export class CreateCapexUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: CreateCapexUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }
    const capexTotal = data.capex.reduce((total, item) => total + item.cost, 0);

    const actionAt = genTimestamp().iso;

    const payload = {
      businessId: data.businessId,
      capex: JSON.stringify(data.capex),
      capexTotal,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(payload),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        capexStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    return updatedBusiness;
  }
}
