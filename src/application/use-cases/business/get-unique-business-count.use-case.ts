import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

interface GetUniqueBusinessCountUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    countryId?: string;
    academicYearId?: string;
    enrollmentStatus?: string;
    accountType?: BusinessModelEnum;
  };
  user: ICurrentUser;
}

export class GetUniqueBusinessCountUseCase {
  constructor(
    private readonly deps: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GetUniqueBusinessCountUseCaseInput) {
    const { businessRepo } = this.deps;
    const { data, user } = input;

    const payload: Record<string, any> = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId,
      countryId: data.countryId,
      accountType: data.accountType,
      enrollmentStatus: data.enrollmentStatus,
    };

    if (!isDefinedStrict(data.academicYearId)) {
      Object.assign(payload, {
        enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          accountType: BusinessModelEnum.B2B,
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          accountType: BusinessModelEnum.B2B,
          schoolId: user.schoolId,
          classAssignments: user.classAssignments,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          studentId: user.id,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await businessRepo.getUniqueBusinessCount(payload);
  }
}
