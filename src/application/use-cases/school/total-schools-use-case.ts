import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { IECScoreFilter } from '@presentation/graphql/modules/student/dto/business-progress.args';
import { BusinessModelEnum, SchoolStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface TotalSchoolsUseCaseInput {
  data: {
    accountType?: BusinessModelEnum;
    status?: string;
    name?: string;
    countryId?: string;
    schoolId?: string;
    I?: IECScoreFilter;
    E?: IECScoreFilter;
    C?: IECScoreFilter;
  };
  user: ICurrentUser;
}

export class TotalSchoolsUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: TotalSchoolsUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const payload = {
      accountType: data.accountType,
      name: data.name,
      countryId: data.countryId,
      I: data.I,
      E: data.E,
      C: data.C,
    };

    switch (data.status) {
      case SchoolStatus.ACTIVE: {
        Object.assign(payload, {
          isActive: true,
        });
        break;
      }
      case SchoolStatus.INACTIVE: {
        Object.assign(payload, {
          isActive: false,
        });
        break;
      }
    }

    return await schoolRepo.countSchools(payload);
  }
}
