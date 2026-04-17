import { ChallengeCreatorType } from '@shared/enums';
import { ChallengeRepository } from '@infrastructure/database';

interface Input {
  data: { challengeId: string; challengeCreatorType: ChallengeCreatorType };
}

export class GetChallengeCreatorUseCase {
  constructor(
    private readonly dependencies: { challengeRepo: ChallengeRepository },
  ) {}

  async execute(input: Input) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    switch (data.challengeCreatorType) {
      case ChallengeCreatorType.PLATFORM_USER:
        const plarformUser =
          await challengeRepo.getPlatformChallengeCreatorByChallengeId({
            challengeId: data.challengeId,
          });

        return plarformUser;

      default:
        return null;
    }
  }
}
