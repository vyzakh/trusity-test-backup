import { PlatformUserRepository } from '@infrastructure/database';

interface GetPlatformUserByAccountIdUseCaseInput {
  data: {
    userAccountId: string;
  };
}

export class GetPlatformUserByAccountIdUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: GetPlatformUserByAccountIdUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data } = input;

    const platformUser = await platformUserRepo.getPlatformUserByAccountId({
      userAccountId: data.userAccountId,
    });

    return platformUser;
  }
}
