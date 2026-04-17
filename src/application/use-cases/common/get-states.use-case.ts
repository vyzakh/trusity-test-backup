import { LookupRepository } from '@infrastructure/database';

interface Input {
  data: {
    countryId: string;
  };
}

export class GetStatesUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    const states = await lookupRepo.findStatesByCountryId({
      countryId: data.countryId,
    });

    return states;
  }
}
