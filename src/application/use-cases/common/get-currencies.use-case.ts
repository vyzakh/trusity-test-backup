import { LookupRepository } from '@infrastructure/database';

export class GetCurrenciesUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const currencies = await lookupRepo.findAllCurrencies();

    return currencies;
  }
}
