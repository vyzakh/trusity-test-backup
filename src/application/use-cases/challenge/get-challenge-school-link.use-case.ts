import { ChallengeRepository } from '@infrastructure/database';

interface Input {
  data: {
    challengeId: string;
  };
}

export class GetChallengeSchoolLinkUseCase {
  constructor(
    private readonly dependencies: { challengeRepo: ChallengeRepository },
  ) {}

  async execute(input: Input) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    const challengeSchoolLink = await challengeRepo.getChallengeSchoolLink({
      challengeId: data.challengeId,
    });

    return challengeSchoolLink;
  }
}
