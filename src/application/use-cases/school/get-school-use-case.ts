import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSchoolUseCaseInput {
  data: {
    schoolId?: string;
  };
  user: ICurrentUser;
}

export class GetSchoolUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: GetSchoolUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      schoolId: data.schoolId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await schoolRepo.getSchool(payload);
  }
}
