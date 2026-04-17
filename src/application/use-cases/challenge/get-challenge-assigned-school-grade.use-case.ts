import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetChallengeAssignedSchoolGradesUseCaseInput {
  data: { challengeId: string; schoolId?: string };
  user: ICurrentUser;
}

export class GetChallengeAssignedSchoolGradesUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeAssignedSchoolGradesUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        if (!data.schoolId) return [];

        const challengeAssignedSchoolGrades = await challengeRepo.getChallengeAssignedSchoolGrades({
          challengeId: data.challengeId,
          schoolId: data.schoolId,
        });

        return challengeAssignedSchoolGrades;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        const challengeAssignedSchoolGrades = await challengeRepo.getChallengeAssignedSchoolGrades({
          challengeId: data.challengeId,
          schoolId: user.schoolId,
        });

        return challengeAssignedSchoolGrades;
      }
      default: {
        return [];
      }
    }
  }
}
