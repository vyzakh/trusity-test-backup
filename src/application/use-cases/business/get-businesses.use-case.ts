import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessSource, UserScope } from '@shared/enums';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface GetBusinessesUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    name?: string;
    schoolId?: string;
    studentId?: string;
    status?: BusinessStatus;
    source?: BusinessSource;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetBusinessesUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GetBusinessesUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const payload: Record<string, any> = {
      offset: data.offset,
      limit: data.limit,
      businessName: data.name,
      status: data.status,
      source: data.source,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus
    };

    if (!data.academicYearId) {
      Object.assign(payload, {
        enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(payload, {
          schoolId: data.schoolId,
          studentId: data.studentId,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          studentId: data.studentId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          studentId: data.studentId,
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

    return await businessRepo.getBusinesses(payload);
  }
}
