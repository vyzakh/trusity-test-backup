import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface GetStudentTotalAverageScoreUseCaseInput {
  data: {
    studentId: string;
    status?: BusinessStatus;
    academicYearId?: string;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
  user: ICurrentUser;
}

export class GetStudentTotalAverageScoreUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetStudentTotalAverageScoreUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data } = input;

    const payload: Record<string, any> = {
      studentId: data.studentId,
      status: data.status,
      academicYearId: data.academicYearId,
    };

    if (!payload.academicYearId) {
      Object.assign(payload, {
        enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
      });
    }

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload, {
          studentId: input.user.id,
          academicYearId: input.data.academicYearId ?? input.user.currentAYId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You do not have permission to access this resource.');
      }
    }

    const { totalAvgScore } = await businessRepo.getTotalAverageScore(payload);

    return totalAvgScore;
  }
}
