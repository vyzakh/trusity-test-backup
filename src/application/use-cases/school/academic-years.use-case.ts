import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface AcademicYearsUseCaseInput {
  data: {
    studentId?:string;
    schoolId?: string;
    offset?: number;
    limit?: number;
  };
  user: ICurrentUser;
}

export class AcademicYearsUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: AcademicYearsUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      schoolId: data.schoolId,
      studentId: data.studentId,
      offset: data.offset,
      limit: data.limit,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:{
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          studentId: user.id,
        });
        break;
      }
    }

    return await schoolRepo.getAcademicYears(payload);
  }
}
