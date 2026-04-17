import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

interface GetTopPerformedBusinessesUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    studentId?: string;
    offset?: number;
    limit?: number;
    status?: BusinessStatus;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetTopPerformedBusinessesUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetTopPerformedBusinessesUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      studentId: data.studentId,
      offset: data.offset,
      limit: data.limit,
      status: data.status,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus,
      mode: 'TOP_ONLY',
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
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
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

    return await businessRepo.getTopPerformedBusinesses(payload);
  }
}
