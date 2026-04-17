import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface TotalSectionsUseCaseInput {
  data: {
    name?: string;
    schoolId?: string;
  };
  user: ICurrentUser;
}

export class TotalSectionsUseCase {
  constructor(private readonly dependencies: { schoolRepo: SchoolRepository }) {}

  async execute(input: TotalSectionsUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      name: data.name,
      schoolId: data.schoolId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await schoolRepo.countSections(payload);
  }
}
