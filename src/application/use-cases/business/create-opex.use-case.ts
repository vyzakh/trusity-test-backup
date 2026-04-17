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
interface OpexItem {
  name: string;
  cost: YearlyCost;
}
interface CreateOpexUseCaseInput {
  data: {
    businessId: string;
    opexBreakdown: OpexItem[];
    cogsBreakdown: OpexItem[];
    opexExpense: {
      y0: number;
      y1: number;
      y2: number;
      y3: number;
      y4: number;
      y5: number;
    };
    opex: {
      M1: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M2: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M3: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M4: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M5: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M6: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M7: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M8: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M9: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M10: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M11: { y1: number; y2: number; y3: number; y4: number; y5: number };
      M12: { y1: number; y2: number; y3: number; y4: number; y5: number };
    };
  };
  user: ICurrentStudentUser;
}

export class CreateOpexUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: CreateOpexUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const actionAt = genTimestamp().iso;

    const opexData = {
      opexExpense: data.opexExpense,
      opexBreakdown: data.opexBreakdown,
      cogsBreakdown: data.cogsBreakdown,
      opex: data.opex,
    };

    const payload = {
      businessId: data.businessId,
      opex: JSON.stringify([opexData]),
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(payload),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        opexStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    return updatedBusiness;
  }
}
