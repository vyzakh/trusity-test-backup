import { LookupRepository } from '@infrastructure/database';

interface TotalCountriesUseCaseInput {
  data: {
    name?: string;
  };
}

export class TotalCountriesUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute(input: TotalCountriesUseCaseInput) {
    const { data } = input;
    const { lookupRepo } = this.dependencies;

    return await lookupRepo.countCountries(data);
  }
}
