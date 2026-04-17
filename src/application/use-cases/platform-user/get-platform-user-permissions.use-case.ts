import { PlatformUserRepository } from '@infrastructure/database';

interface GetPlatformUserPermissionsUseCaseInput {
  data: { platformUserId: string };
}

export class GetPlatformUserPermissionsUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: GetPlatformUserPermissionsUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data } = input;

    return await platformUserRepo.getPermissions({ platformUserId: data.platformUserId });
  }
}
