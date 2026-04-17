import { ICurrentStudentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface BrandFont {
  url: string;
  name: string;
}

interface BrandingData {
  brandVoice: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  selectedFont: BrandFont;
}

interface SaveBrandingUseCaseInput {
  data: {
    businessId: string;
    branding: BrandingData;
    customerExperience: string;
  };
  user: ICurrentStudentUser;
}

export class SaveBrandingUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: SaveBrandingUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const business = await businessRepo.getBusiness({ businessId: data.businessId });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const actionAt = genTimestamp().iso;

    const finalPayload = {
      businessId: data.businessId,
      branding: JSON.stringify(data.branding),
      customerExperience: data.customerExperience,
      updatedAt: actionAt,
    };

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness(finalPayload),
      businessRepo.updateBusinessProgressStatus({
        businessId: data.businessId,
        brandingStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    return updatedBusiness;
  }
}
