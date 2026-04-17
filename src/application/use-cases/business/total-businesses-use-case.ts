import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessModelEnum, BusinessSource, UserScope } from '@shared/enums';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface TotalBusinessesUseCaseInput {
  data: {
    name?: string;
    schoolId?: string;
    studentId?: string;
    status?: BusinessStatus;
    countryId?: string;
    accountType?: BusinessModelEnum;
    source?: BusinessSource;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class TotalBusinessesUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: TotalBusinessesUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      name: data.name,
      schoolId: data.schoolId,
      studentId: data.studentId,
      status: data.status,
      countryId: data.countryId,
      accountType: data.accountType,
      source: data.source,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus,
    };

    if (!data.academicYearId) {
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
          academicYearId: data.academicYearId ?? user.currentAYId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await businessRepo.countBusinesses(payload);
  }
}
