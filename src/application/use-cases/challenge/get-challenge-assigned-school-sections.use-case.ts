import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetChallengeAssignedSchoolSectionsUseCaseInput {
  data: {
    schoolId?: string;
    challengeId: string;
    gradeId: number;
  };
  user: ICurrentUser;
}

export class GetChallengeAssignedSchoolSectionsUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeAssignedSchoolSectionsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        const challengeAssignedSchoolSections = await challengeRepo.getChallengeAssignedSchoolSections({
          challengeId: data.challengeId,
          schoolId: data.schoolId,
          gradeId: data.gradeId,
        });

        return challengeAssignedSchoolSections;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        const challengeAssignedSchoolSections = await challengeRepo.getChallengeAssignedSchoolSections({
          challengeId: data.challengeId,
          schoolId: user.schoolId,
          gradeId: data.gradeId,
        });

        return challengeAssignedSchoolSections;
      }
      default: {
        return [];
      }
    }
  }
}
