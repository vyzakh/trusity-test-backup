import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetStudentBusinessStatsUseCaseInput {
  data: {
    studentId: string;
    academicYearId?: string;
  };
  user: ICurrentUser;
}

export class GetStudentBusinessStatsUseCase {
  constructor(private readonly deps: { businessRepo: BusinessRepository }) {}

  async execute(input: GetStudentBusinessStatsUseCaseInput) {
    const payload: Record<string, any> = {
      studentId: input.data.studentId,
      academicYearId: input.data.academicYearId,
    };

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
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await this.deps.businessRepo.getBusinessStatsByStudentId(payload);
  }
}
