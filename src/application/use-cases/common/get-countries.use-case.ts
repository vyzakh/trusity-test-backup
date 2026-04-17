import { LookupRepository } from '@infrastructure/database';

interface GetCountriesUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    name?: string;
  };
}

export class GetCountriesUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute(input: GetCountriesUseCaseInput) {
    const { data } = input;
    const { lookupRepo } = this.dependencies;

    const countries = await lookupRepo.findAllCountries(data);

    return countries;
  }
}
