import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

export interface GetOverallBusinessReportUseCaseInput {
  data: {
    studentId: string;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetOverallBusinessReportUseCase {
  constructor(
    private readonly deps: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GetOverallBusinessReportUseCaseInput) {
    const payload: Record<string, any> = {
      studentId: input.data.studentId,
      academicYearId: input.data.academicYearId,
    };

    if (!isDefinedStrict(input.data.academicYearId)) {
      Object.assign(payload, {
        enrollmentStatus: input.data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
          studentId: input.user.id,
          academicYearId: input.data.academicYearId ?? input.user.currentAYId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await this.deps.businessRepo.getOverallBusinessReport(payload);
  }
}
