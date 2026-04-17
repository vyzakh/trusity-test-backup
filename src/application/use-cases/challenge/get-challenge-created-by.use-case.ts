import { UserAccountRepository } from '@infrastructure/database';
import { ChallengeCreatorType } from '@shared/enums';

interface GetChallengeCreatedByUseCaseInput {
  data: {
    userAccountId: string;
    scope: ChallengeCreatorType;
  };
}

export class GetChallengeCreatedByUseCase {
  constructor(
    private readonly dependencies: {
      userAccountRepo: UserAccountRepository;
    },
  ) {}

  async execute(input: GetChallengeCreatedByUseCaseInput) {
    const { userAccountRepo } = this.dependencies;
    const { data } = input;

    switch (data.scope) {
      case ChallengeCreatorType.PLATFORM_USER: {
        return await userAccountRepo.getPlatformUserByAccountId({
          userAccountId: data.userAccountId,
        });
      }
      case ChallengeCreatorType.SCHOOL_ADMIN: {
        return await userAccountRepo.getSchoolAdminUserByAccountId({
          userAccountId: data.userAccountId,
        });
      }
      case ChallengeCreatorType.TEACHER: {
        return await userAccountRepo.getTeacherUserByAccountId({
          userAccountId: data.userAccountId,
        });
      }
      default: {
        return null;
      }
    }
  }
}
