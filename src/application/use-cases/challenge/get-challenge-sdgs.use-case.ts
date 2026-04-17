import { ChallengeRepository } from '@infrastructure/database';

interface Input {
  data: {
    challengeId: string;
  };
}

export class GetChallengeSdgsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: Input) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    const challengeSdgs = await challengeRepo.findChallengeSdgs({
      challengeId: data.challengeId,
    });

    return challengeSdgs;
  }
}
