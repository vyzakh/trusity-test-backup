import { LookupRepository } from '@infrastructure/database';

export class GetChallengeSectorsUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const challengeSectors = await lookupRepo.findAllChallengeSectors();

    return challengeSectors;
  }
}
