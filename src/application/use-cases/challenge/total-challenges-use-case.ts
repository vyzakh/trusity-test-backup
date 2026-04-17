import { ChallengeRepository } from '@infrastructure/database';
import { ChallengeCreatorType, ChallengeScope, UserScope } from '@shared/enums';
import { ICurrentUser } from 'src/core/types';

interface TotalChallengesUseCaseInput {
  data: {
    title?: string;
    creatorType?: ChallengeCreatorType;
    scope?: ChallengeScope;
    schoolId?: string;
    createdBy?: string;
  };
  user: ICurrentUser;
}

export class TotalChallengesUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: TotalChallengesUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data, user } = input;

    const challengesQuery = {
      title: data.title,
    };

    switch (data.scope) {
      case ChallengeScope.TRUSITY: {
        Object.assign(challengesQuery, {
          scope: ChallengeScope.TRUSITY,
        });
        if (user.scope === UserScope.PLATFORM_USER) {
          Object.assign(challengesQuery, {
            createdBy: data.createdBy,
          });
        }
        if (user.scope === UserScope.TEACHER || user.scope === UserScope.STUDENT) {
          Object.assign(challengesQuery, {
            excludeHidden: true,
            viewerSchoolId: user.schoolId,
          });
        }
        break;
      }
      case ChallengeScope.SCHOOL: {
        Object.assign(challengesQuery, {
          scope: ChallengeScope.SCHOOL,
        });
        if (user.scope === UserScope.PLATFORM_USER) {
          Object.assign(challengesQuery, {
            schoolId: data.schoolId,
            creatorType: data.creatorType,
            createdBy: data.createdBy,
          });
        }
        if (user.scope === UserScope.SCHOOL_ADMIN) {
          Object.assign(challengesQuery, {
            schoolId: user.schoolId,
            creatorType: data.creatorType,
            createdBy: data.createdBy,
          });
          if (data.creatorType === ChallengeCreatorType.SCHOOL_ADMIN) {
            Object.assign(challengesQuery, {
              excludeCurrentUser: user.userAccountId,
            });
          }
        }
        if (user.scope === UserScope.TEACHER) {
          Object.assign(challengesQuery, {
            schoolId: user.schoolId,
            creatorType: data.creatorType,
          });
        }
        if (user.scope === UserScope.STUDENT) {
          Object.assign(challengesQuery, {
            schoolId: user.schoolId,
            studentId: user.id,
            creatorType: data.creatorType,
          });
        }
        break;
      }
      default: {
        switch (user.scope) {
          case UserScope.PLATFORM_USER: {
            Object.assign(challengesQuery, {
              scope: ChallengeScope.TRUSITY,
              createdBy: user.userAccountId,
            });
            break;
          }
          case UserScope.SCHOOL_ADMIN: {
            Object.assign(challengesQuery, {
              scope: ChallengeScope.SCHOOL,
              schoolId: user.schoolId,
              createdBy: user.userAccountId,
            });
            break;
          }
          case UserScope.TEACHER: {
            Object.assign(challengesQuery, {
              scope: ChallengeScope.SCHOOL,
              schoolId: user.schoolId,
              createdBy: user.userAccountId,
            });
            break;
          }
          case UserScope.STUDENT: {
            Object.assign(challengesQuery, {
              scope: ChallengeScope.SCHOOL,
              schoolId: user.schoolId,
              studentId: user.id,
            });
            break;
          }
        }
      }
    }
    return challengeRepo.countChallenges(challengesQuery);
  }
}
