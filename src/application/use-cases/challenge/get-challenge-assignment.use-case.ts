import { UserScope } from '@shared/enums';
import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeAssignmentUseCaseInput {
  data: { challengeId: string; schoolId?: string };
  user: ICurrentUser;
}

export class GetChallengeAssignmentUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeAssignmentUseCaseInput) {
    const { data, user } = input;
    const { challengeRepo } = this.dependencies;

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        if (!data.schoolId) return null;

        const challengeAssignment = await challengeRepo.getChallengeAssignment({
          challengeId: data.challengeId,
          schoolId: data.schoolId,
        });

        return challengeAssignment;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        const challengeAssignment = await challengeRepo.getChallengeAssignment({
          challengeId: data.challengeId,
          schoolId: user.schoolId,
        });

        return challengeAssignment;
      }
      default: {
        return null;
      }
    }
  }
}
