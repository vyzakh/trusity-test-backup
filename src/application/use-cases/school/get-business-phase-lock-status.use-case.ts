import { ICurrentUser } from '@core/types';
import { BusinessPhaseLockRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { BadRequestException, ForbiddenException } from '@shared/execeptions';

interface GetBusinessPhaseLockStatusUseCaseInput {
  data: {
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
    studentId?: string;
    studentIds?: string[];
    academicYearId?: string;
    businessId?: string;
  };
  user: ICurrentUser;
}

export class GetBusinessPhaseLockStatusUseCase {
  constructor(private readonly dependencies: { businessPhaseLockRepo: BusinessPhaseLockRepository }) {}

  async execute(input: GetBusinessPhaseLockStatusUseCaseInput) {
    const { businessPhaseLockRepo } = this.dependencies;
    const { data, user } = input;

    let schoolId = data.schoolId;

    switch (user.scope) {
      case UserScope.PLATFORM_USER:
        break;

      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT:
        schoolId = user.schoolId;
        break;

      default:
        throw new ForbiddenException('You are not allowed to perform this action.');
    }

    if (data.studentId || data.studentIds) {
      const rows = await businessPhaseLockRepo.getStudentPhaseLockStatus({
        studentId: data.studentId,
        studentIds: data.studentIds,
        schoolId,
        academicYearId: data.academicYearId,
        businessId: data.businessId,
        enrollmentStatus: data.academicYearId ? undefined : EnrollmentStatusEnum.ACTIVE,
      });

      const conflictingPhases = rows.filter((r) => Number(r.lock_variants) > 1).map((r) => r.phase);

      if (conflictingPhases.length) {
        throw new BadRequestException('Conflicting lock status for phases');
      }

      return rows.map((r) => ({
        phase: r.phase,
        is_locked: r.is_locked,
      }));
    }

    const rows = await businessPhaseLockRepo.getPhaseLockStatusForClass({
      schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId,
    });

    return rows.map((r) => ({
      phase: r.phase,
      is_locked: r.is_locked,
    }));
  }
}
