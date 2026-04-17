import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { IECScoreFilter } from '@presentation/graphql/modules/student/dto/business-progress.args';
import { BusinessModelEnum, SchoolStatus, UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { sanitizeInput } from '@shared/utils';

interface GetSchoolsUseCaseInput {
  data: {
    accountType?: BusinessModelEnum;
    status?: SchoolStatus;
    name?: string;
    countryId?: string;
    offset?: number;
    limit?: number;
    I?: IECScoreFilter;
    E?: IECScoreFilter;
    C?: IECScoreFilter;
  };
  user: ICurrentUser;
}

export class GetSchoolsUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: GetSchoolsUseCaseInput) {
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
      offset: data.offset,
      limit: data.limit,
      accountType: data.accountType,
      countryId: data.countryId,
      name: sanitizeInput(data.name),
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

    return await schoolRepo.getSchools(payload);
  }
}
