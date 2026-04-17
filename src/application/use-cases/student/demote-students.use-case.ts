import { getNextAcademicYear, getPreviousAcademicYear } from '@application/common';
import { ICurrentUser } from '@core/types';
import { LookupRepository, StudentRepository } from '@infrastructure/database';
import { AcademicYearRepository } from '@infrastructure/database/repositories/academic-year.repository';
import { UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface DemoteStudentsUseCaseInput {
  data: {
    studentIds: string[];
  };
  user: ICurrentUser;
}

export class DemoteStudentsUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
      lookupRepo: LookupRepository;
      academicYearRepo: AcademicYearRepository;
    },
  ) {}

  async execute(input: DemoteStudentsUseCaseInput) {
    const { data, user } = input;
    const actionTimestamp = genTimestamp().iso;

    const payload: Record<string, any> = {
      studentIds: data.studentIds,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, { schoolId: user.schoolId });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const [activeStatus, repeatedStatus] = await Promise.all([
      this.deps.lookupRepo.getEnrollmentStatus({
        enrollmentStatusCode: EnrollmentStatusEnum.ACTIVE,
      }),
      this.deps.lookupRepo.getEnrollmentStatus({
        enrollmentStatusCode: EnrollmentStatusEnum.REPEATED,
      }),
    ]);

    if (!activeStatus || !repeatedStatus) {
      throw new NotFoundException('Critical lookup data missing: Active or Repeated Enrollment Status.');
    }

    const currentEnrollments = await this.deps.studentRepo.getEnrollments({
      studentIds: payload.studentIds,
      schoolId: payload.schoolId,
      enrollmentStatuses: [EnrollmentStatusEnum.ACTIVE, EnrollmentStatusEnum.GRADUATED],
    });

    const updateTasks: Promise<any>[] = [];

    for (const currentEnrollment of currentEnrollments) {
      const prevAYRange = getPreviousAcademicYear({
        startDate: new Date(currentEnrollment.academicStartDate).toISOString(),
        endDate: new Date(currentEnrollment.academicEndDate).toISOString(),
      });

      const nextAYRange = getNextAcademicYear({
        startDate: prevAYRange.startDate,
        endDate: prevAYRange.endDate,
      });

      const previousAY = await this.deps.academicYearRepo.getAcademicYear({
        schoolId: currentEnrollment.schoolId,
        startYear: prevAYRange.startYear,
        endYear: prevAYRange.endYear,
      });

      const nextAY = await this.deps.academicYearRepo.getAcademicYear({
        schoolId: currentEnrollment.schoolId,
        startYear: nextAYRange.startYear,
        endYear: nextAYRange.endYear,
      });

      if (!previousAY) continue;

      const previousEnrollment = await this.deps.studentRepo.getEnrollment({
        schoolId: currentEnrollment.schoolId,
        studentId: currentEnrollment.studentId,
        academicYearId: previousAY.id,
        enrollmentStatus: EnrollmentStatusEnum.PROMOTED,
      });

      switch (currentEnrollment.enrollmentStatus) {
        case EnrollmentStatusEnum.ACTIVE: {
          if (!previousEnrollment) continue;

          updateTasks.push(
            this.deps.studentRepo.updateEnrollment({
              enrollmentStatusId: repeatedStatus.id,
              qSchoolId: currentEnrollment.schoolId,
              qStudentId: currentEnrollment.studentId,
              qAcademicYearId: previousEnrollment.academicYearId,
              updatedAt: actionTimestamp,
            }),
          );

          updateTasks.push(
            this.deps.studentRepo.updateEnrollment({
              gradeId: previousEnrollment.gradeId,
              sectionId: previousEnrollment.sectionId,
              qSchoolId: currentEnrollment.schoolId,
              qStudentId: currentEnrollment.studentId,
              qAcademicYearId: currentEnrollment.academicYearId,
              updatedAt: actionTimestamp,
            }),
          );

          break;
        }
        case EnrollmentStatusEnum.GRADUATED: {
          if (!nextAY) continue;

          updateTasks.push(
            this.deps.studentRepo.updateEnrollment({
              enrollmentStatusId: repeatedStatus.id,
              qSchoolId: currentEnrollment.schoolId,
              qstudentId: currentEnrollment.studentId,
              qAcademicYearId: currentEnrollment.academicYearId,
              updatedAt: actionTimestamp,
            }),
          );

          updateTasks.push(
            this.deps.studentRepo.createEnrollment({
              studentId: currentEnrollment.studentId,
              schoolId: currentEnrollment.schoolId,
              academicYearId: nextAY.id,
              gradeId: currentEnrollment.gradeId,
              sectionId: currentEnrollment.sectionId,
              enrollmentStatusId: activeStatus.id,
              enrollmentDate: actionTimestamp,
            }),
          );

          break;
        }
      }
    }

    if (updateTasks.length > 0) {
      await Promise.all(updateTasks);
    }
  }
}
