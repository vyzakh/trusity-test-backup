import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';

interface GetAcademicYearUseCaseInput {
  data: {
    academicYearId?: string | null;
    schoolId?: string | null;
    isActive?: boolean;
    academicStartMonth?: number | null;
    academicEndMonth?: number | null;
  };
  user: ICurrentUser;
}

export class GetAcademicYearUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: GetAcademicYearUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      schoolId: data.schoolId,
      academicYearId: data.academicYearId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER:
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
    }

    return await schoolRepo.getAcademicYear(payload);
  }
}
