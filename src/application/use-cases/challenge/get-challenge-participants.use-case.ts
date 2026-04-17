import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { ChallengeParticipationEnum, UserScope } from '@shared/enums';

interface GetChallengeParticipantsUseCaseInput {
  data: {
    challengeId: string;
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    name?: string;
    limit?: number;
    offset?: number;
    participation?: ChallengeParticipationEnum;
  };
  user: ICurrentUser;
}

export class GetChallengeParticipantsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetChallengeParticipantsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    const filters: Record<string, any> = {
      challengeId: data.challengeId,
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      limit: data.limit,
      offset: data.offset,
      name: data.name,
      participation: data.participation,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        break;

      case UserScope.SCHOOL_ADMIN:
        filters.schoolId = user.schoolId;
        break;

      case UserScope.TEACHER:
        filters.schoolId = user.schoolId;
        //filters.teacherId = user.id;
        break;

      default:
        return [];
    }

    return await challengeRepo.getChallengeParticipants(filters);
  }
}
