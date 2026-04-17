import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

interface GetBusinessesAverageScoresUseCaseInput {
  data: {
    schoolId?: string;
    countryId?: string;
    studentId?: string;
    accountType?: BusinessModelEnum;
    enrollmentStatus?: EnrollmentStatusEnum;
    academicYearId?: string;
  };
  user: ICurrentUser;
}

export class GetBusinessesAverageScoresUseCase {
  constructor(private readonly deps: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessesAverageScoresUseCaseInput) {
    const { businessRepo } = this.deps;
    const { data, user } = input;

    const payload: Record<string, any> = {
      schoolId: data.schoolId,
      studentId: data.studentId,
      countryId: data.countryId,
      accountType: data.accountType,
      academicYearId: data.academicYearId,
      enrollmentStatus: data.enrollmentStatus
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
          academicYearId: data.academicYearId ?? user.currentAYId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const { avgIScore, avgEScore, avgCScore } = await businessRepo.getBusinessesAverageScores(payload);

    return {
      avgIScore: avgIScore,
      avgEScore: avgEScore,
      avgCScore: avgCScore,
      averageScore: (avgIScore + avgEScore + avgCScore) / 3,
    };
  }
}
