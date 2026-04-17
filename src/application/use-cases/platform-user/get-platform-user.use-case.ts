import { ICurrentPlatformUser } from '@core/types';
import { PlatformUserRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetPlatformUserUseCaseInput {
  data: {
    platformUserId: string;
  };
  user: ICurrentPlatformUser;
}

export class GetPlatformUserUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: GetPlatformUserUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      platformUserId: data.platformUserId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        // TODO
        // if (user.role !== PlatformUserRole.SUPERADMIN) {
        //   query.role = PlatformUserRole.USER;
        // }

        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await platformUserRepo.getPlatformUserById(query);
  }
}
