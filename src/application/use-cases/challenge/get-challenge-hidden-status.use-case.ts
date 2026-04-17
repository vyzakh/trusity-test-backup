import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetChallengeHiddenStatusUseCaseInput {
  data: {
    challengeId: string;
  };
  user: ICurrentUser;
}

export class GetChallengeHiddenStatusUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeHiddenStatusUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.SCHOOL_ADMIN: {
        break;
      }
      default: {
        return false;
      }
    }

    return challengeRepo.isChallengeHidden({
      challengeId: data.challengeId,
      schoolId: user.schoolId,
    });
  }
}
