import { ICurrentUser } from '@core/types';
import { LookupRepository } from '@infrastructure/database';
import { AvatarFields } from '@presentation/graphql/modules/common/types';

interface UpdateCountryAvatarsUseCaseInput {
  data: {
    countryId: string;
    group1?: AvatarFields;
    group2?: AvatarFields;
    group3?: AvatarFields;
    group4?: AvatarFields;
    isFallbackDefault: boolean;
  };
}

export class UpdateCountryAvatarsUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute(input: UpdateCountryAvatarsUseCaseInput) {
    const { data } = input;
    const { lookupRepo } = this.dependencies;
    return await lookupRepo.updateCountryAvatars(data);
  }
}
