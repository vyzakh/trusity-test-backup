import { ICurrentPlatformUser, ICurrentSchoolAdminUser } from '@core/types';
import { SchoolAdminRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSchoolAdminsUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    name?: string;
    schoolId?: string;
  };
  user: ICurrentPlatformUser | ICurrentSchoolAdminUser;
}

export class GetSchoolAdminsUseCase {
  constructor(private readonly dependencies: { schoolAdminRepo: SchoolAdminRepository }) {}

  async execute(input: GetSchoolAdminsUseCaseInput) {
    const { schoolAdminRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      offset: data.offset,
      limit: data.limit,
      name: data.name,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        query.schoolId = data.schoolId;
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        query.schoolId = user.schoolId;
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const schoolAdmins = await schoolAdminRepo.getSchoolAdmins(query);

    return schoolAdmins;
  }
}
