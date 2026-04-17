import { LookupRepository } from '@infrastructure/database';
import { isDefinedStrict } from '@shared/utils';

interface Input {
  data: { countryId?: string | null };
}

export class GetCountryUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    if (!isDefinedStrict(data.countryId)) {
      return null;
    }

    const country = await lookupRepo.findCountry({ countryId: data.countryId });

    return country;
  }
}
