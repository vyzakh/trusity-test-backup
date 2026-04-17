import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';
import { ChallengeParticipationEnum, UserScope } from '@shared/enums';

interface CountChallengeParticipantsUseCaseInput {
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

export class CountChallengeParticipantsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: CountChallengeParticipantsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;
    const filters: Record<string, any> = {
      challengeId: data.challengeId,
      schoolId: data.schoolId,
      schoolGradeId: data.gradeId,
      schoolSectionId: data.sectionId,
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
        // filters.teacherId = user.id;
        break;

      default:
        return 0;
    }

    return await challengeRepo.countParticipants(filters);
  }
}
