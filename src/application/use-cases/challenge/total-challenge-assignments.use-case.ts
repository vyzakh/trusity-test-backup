import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { ChallengeParticipationEnum, UserScope } from '@shared/enums';

interface TotalChallengeAssignmentsUseCaseInput {
  data: {
    challengeId?: string;
    name?: string;
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    participation?: ChallengeParticipationEnum;
  };
  user: ICurrentUser;
}

export class TotalChallengeAssignmentsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: TotalChallengeAssignmentsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    const challengeAssignmentsQuery: Record<string, any> = {
      challengeId: data.challengeId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      name: data.name,
      participation: data.participation,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        challengeAssignmentsQuery.schoolId = data.schoolId;
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        challengeAssignmentsQuery.schoolId = user.schoolId;
        break;
      }

      case UserScope.TEACHER: {
        challengeAssignmentsQuery.schoolId = user.schoolId;
        challengeAssignmentsQuery.classAssignments = user.classAssignments;

        break;
      }
    }

    const totalChallengeAssignments = await challengeRepo.countChallengeAssignemnts(challengeAssignmentsQuery);

    return totalChallengeAssignments;
  }
}
