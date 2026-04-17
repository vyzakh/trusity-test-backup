import { LookupRepository } from '@infrastructure/database';
import { isDefinedStrict } from '@shared/utils';

interface Input {
  data: { cityId?: string | null };
}

export class GetCityUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    if (!isDefinedStrict(data.cityId)) {
      return null;
    }

    const city = await lookupRepo.findCity({ cityId: data.cityId });

    return city;
  }
}
