import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetChallengeAssignedSchoolsUseCaseInput {
  data: { challengeId: string };
  user: ICurrentUser;
}

export class GetChallengeAssignedSchoolsUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeAssignedSchoolsUseCaseInput) {
    const { data, user } = input;
    const { challengeRepo } = this.dependencies;

    const assignedSchoolsQuery: Record<string, any> = { challengeId: data.challengeId };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        assignedSchoolsQuery.schoolId = user.schoolId;
        break;
      }
      default: {
        return [];
      }
    }

    const challengeAssignedSchools = await challengeRepo.getChallengeAssignedSchools(assignedSchoolsQuery);

    return challengeAssignedSchools;
  }
}
