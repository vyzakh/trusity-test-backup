import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetAssignedChallengeUseCaseInput {
  data: { challengeId: string };
  user: ICurrentUser;
}

export class GetAssignedChallengeUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetAssignedChallengeUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.STUDENT: {
        return await challengeRepo.getAssignedChallenge({ challengeId: data.challengeId, studentId: user.id });
      }
      default: {
        return null;
      }
    }
  }
}
