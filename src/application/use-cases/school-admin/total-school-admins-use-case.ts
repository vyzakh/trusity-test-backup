import { SchoolAdminRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { ICurrentUser } from 'src/core/types';

interface Input {
  data: {
    name?: string;
    schoolId?: string;
  };
  user: ICurrentUser;
}

export class TotalSchoolAdminsUseCase {
  constructor(private readonly dependencies: { schoolAdminRepo: SchoolAdminRepository }) {}

  async execute(input: Input) {
    const { schoolAdminRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      name: data.name,
      schoolId: data.schoolId,
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

    const totalSchoolAdmins = await schoolAdminRepo.countSchoolAdmins(query);

    return totalSchoolAdmins;
  }
}
