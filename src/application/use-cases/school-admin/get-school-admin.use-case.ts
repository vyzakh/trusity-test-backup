import { ICurrentPlatformUser, ICurrentSchoolAdminUser } from '@core/types';
import { SchoolAdminRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSchoolAdminUseCaseInput {
  data: { schoolAdminId: string };
  user: ICurrentPlatformUser | ICurrentSchoolAdminUser;
}

export class GetSchoolAdminUseCase {
  constructor(private readonly dependencies: { schoolAdminRepo: SchoolAdminRepository }) {}

  async execute(input: GetSchoolAdminUseCaseInput) {
    const { schoolAdminRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = { schoolAdminId: data.schoolAdminId };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
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

    return await schoolAdminRepo.getSchoolAdminById(query);
  }
}
