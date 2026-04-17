import { LookupRepository } from '@infrastructure/database';

interface Input {
  data: {
    challengeSectorId: number;
  };
}

export class GetChallengeSectorUseCase {
  constructor(
    private readonly dependencies: {
      lookupRepo: LookupRepository;
    },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    const challengeSector = await lookupRepo.findChallengeSectorById({
      challengeSectorId: data.challengeSectorId,
    });

    return challengeSector;
  }
}
