import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { ChallengeParticipationEnum, UserScope } from '@shared/enums';

interface GetChallengeAssignmentsUseCaseInput {
  data: {
    challengeId: string;
    name?: string;
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    offset?: number;
    limit?: number;
    participation?: ChallengeParticipationEnum;
  };
  user: ICurrentUser;
}

export class GetChallengeAssignmentsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetChallengeAssignmentsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    const challengeAssignmentsQuery: Record<string, any> = {
      offset: data.offset,
      limit: data.limit,
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

    const challengeAssignments = await challengeRepo.getChallengeAssignments(challengeAssignmentsQuery);

    return challengeAssignments;
  }
}
