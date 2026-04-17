import { ICurrentUser } from '@core/types';
import { StudentRepository } from '@infrastructure/database';
import { IECScoreFilter } from '@presentation/graphql/modules/student/dto/business-progress.args';
import { BusinessModelEnum, BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';
import { isDefinedStrict } from '@shared/utils';

interface TotalStudentsUseCaseInput {
  data: {
    name?: string;
    schoolId?: string;
    accountType?: BusinessModelEnum;
    enrollmentStatus?: string;
    teacherId?: string;
    gradeId?: number;
    sectionId?: number;
    countryId?: string;
    academicYearId?: string;
    businessStatus?: BusinessStatus;
    I?: IECScoreFilter;
    E?: IECScoreFilter;
    C?: IECScoreFilter;
  };
  user: ICurrentUser;
}

export class TotalStudentsUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: TotalStudentsUseCaseInput) {
    const { studentRepo } = this.deps;
    const { data, user } = input;

    const payload: Record<string, any> = {
      name: data.name,
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId,
      countryId: data.countryId,
      accountType: data.accountType,
      teacherId: data.teacherId,
      enrollmentStatus: data.enrollmentStatus,
      businessStatus: data.businessStatus,
      I: data.I,
      E: data.E,
      C: data.C,
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
          classAssignments: user.classAssignments,
          accountType: BusinessModelEnum.B2B,
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await studentRepo.countStudents(payload);
  }
}
