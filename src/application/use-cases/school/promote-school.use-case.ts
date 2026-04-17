import { SchoolPromoteService } from '@application/services/school-promote.service';
import { ICurrentUser } from '@core/types';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface PromoteSchoolUseCaseInput {
  data: {
    schoolId?: string | null;
    forcePromotion?: boolean | null;
  };
  user: ICurrentUser;
}

export class PromoteSchoolUseCase {
  constructor(
    private readonly deps: {
      schoolPromoteService: SchoolPromoteService;
    },
  ) {}

  async execute(input: PromoteSchoolUseCaseInput) {
    const { data, user } = input;

    const payload: Record<string, any> = {
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

    await this.deps.schoolPromoteService.execute({
      data: {
        schoolId: payload.schoolId,
        forcePromotion: data.forcePromotion,
      },
    });
  }
}
