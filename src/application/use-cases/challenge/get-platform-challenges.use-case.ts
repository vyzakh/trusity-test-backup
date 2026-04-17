import { ChallengeRepository } from '@infrastructure/database/repositories';

interface Input {
  data: any;
}

export class GetPlatformChallengesUseCase {
  constructor(
    private readonly dependencies: { challengeRepo: ChallengeRepository },
  ) {}

  async execute(input: Input) {
    const { challengeRepo } = this.dependencies;

    console.log(input);

    return [];
  }
}
