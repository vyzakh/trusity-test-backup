import { ICurrentSchoolAdminUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface UnHideTrusityChallengeUseCaseInput {
  data: { challengeId: string };
  user: ICurrentSchoolAdminUser;
}

export class UnHideTrusityChallengeUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: UnHideTrusityChallengeUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.SCHOOL_ADMIN: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    await challengeRepo.unHideChallenge({
      challengeId: data.challengeId,
      schoolId: user.schoolId,
    });
  }
}
