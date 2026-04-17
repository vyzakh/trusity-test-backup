import { LookupRepository } from '@infrastructure/database';

export class GetSdgsUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const sdgs = await lookupRepo.findAllSdgs();

    return sdgs;
  }
}
