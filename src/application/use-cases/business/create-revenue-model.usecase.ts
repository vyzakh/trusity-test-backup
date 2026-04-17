import { ICurrentStudentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException, ValidationException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface CreateRevenueModelUseCaseInput {
  data: {
    businessId: string;
    currencyId: number;
    revenueModel: string;
    unitSalesPercentage: number;
  };
  user: ICurrentStudentUser;
}

export class CreateRevenueModelUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: CreateRevenueModelUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const currency = await businessRepo.findCurrencyById(data.currencyId);
    if (!currency) {
      throw new ValidationException('Invalid currency selected');
    }

    const actionAt = genTimestamp().iso;

    const revenueModelData = {
      currencyId: data.currencyId,
      currencyCode: currency.code,
      revenueModel: data.revenueModel,
      unitSalesPercentage: data.unitSalesPercentage,
    };

    const payload = {
      businessId: data.businessId,
      revenueModel: JSON.stringify(revenueModelData),
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(payload),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        revenueModelStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    return updatedBusiness;
  }
}
