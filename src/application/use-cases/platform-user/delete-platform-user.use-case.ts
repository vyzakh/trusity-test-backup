import { ICurrentPlatformUser } from '@core/types';
import { PlatformUserRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface DeletePlatformUserUseCaseInput {
  data: { platformUserId: string };
  user: ICurrentPlatformUser;
}

export class DeletePlatformUserUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: DeletePlatformUserUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      platformUserId: data.platformUserId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    await platformUserRepo.deletePlatformUser(query);
  }
}
