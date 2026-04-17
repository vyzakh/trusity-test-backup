import { ICurrentPlatformUser } from '@core/types';
import { PlatformUserRepository, UserAccountRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface UpdatePlatformUserUseCaseInput {
  data: {
    platformUserId?: string;
    name?: string;
    email?: string;
    contactNumber?: string | null;
  };
  user: ICurrentPlatformUser;
}

export class UpdatePlatformUserUseCase {
  constructor(
    private readonly dependencies: {
      platformUserRepo: PlatformUserRepository;
      userAccountRepo: UserAccountRepository;
    },
  ) {}

  async execute(input: UpdatePlatformUserUseCaseInput) {
    const { platformUserRepo, userAccountRepo } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      platformUserId: data.platformUserId,
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      contactNumber: sanitizeInput(data.contactNumber),
      updatedAt: genTimestamp().iso,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const updatedPlatformUser = await platformUserRepo.updatePlatformUser(payload);

    if (updatedPlatformUser) {
      if (data.email) {
        await userAccountRepo.updateUserAccount({
          userAccountId: updatedPlatformUser.userAccountId,
          email: updatedPlatformUser.email,
        });
      }
    }

    return updatedPlatformUser;
  }
}
