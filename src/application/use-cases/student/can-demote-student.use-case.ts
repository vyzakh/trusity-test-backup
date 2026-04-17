import { getPreviousAcademicYear } from '@application/common';
import { ICurrentUser } from '@core/types';
import { StudentRepository } from '@infrastructure/database';
import { AcademicYearRepository } from '@infrastructure/database/repositories/academic-year.repository';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface CanDemoteStudentUseCaseInput {
  data: {
    studentId: string;
  };
  user: ICurrentUser;
}

export class CanDemoteStudentUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
      academicYearRepo: AcademicYearRepository;
    },
  ) {}

  async execute(input: CanDemoteStudentUseCaseInput) {
    const { data, user } = input;

    const payload: Record<string, any> = {
      studentId: data.studentId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(payload, { schoolId: user.schoolId });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const currentEnrollment = await this.deps.studentRepo.getEnrollment({
      studentId: payload.studentId,
      schoolId: payload.schoolId,
      enrollmentStatuses: [EnrollmentStatusEnum.ACTIVE, EnrollmentStatusEnum.GRADUATED],
    });

    if (!currentEnrollment) return false;

    switch (currentEnrollment.enrollmentStatus) {
      case EnrollmentStatusEnum.ACTIVE: {
        const prevAYRange = getPreviousAcademicYear({
          startDate: new Date(currentEnrollment.academicStartDate).toISOString(),
          endDate: new Date(currentEnrollment.academicEndDate).toISOString(),
        });

        const previousAY = await this.deps.academicYearRepo.getAcademicYear({
          schoolId: currentEnrollment.schoolId,
          startDate: prevAYRange.startDate,
          endDate: prevAYRange.endDate,
        });

        if (!previousAY) return false;

        const previousEnrollment = await this.deps.studentRepo.getEnrollment({
          schoolId: currentEnrollment.schoolId,
          studentId: currentEnrollment.studentId,
          academicYearId: previousAY.id,
          enrollmentStatus: EnrollmentStatusEnum.PROMOTED,
        });

        if (previousEnrollment) return true;

        return false;
      }
      case EnrollmentStatusEnum.GRADUATED: {
        return true;
      }
      default: {
        return false;
      }
    }
  }
}
