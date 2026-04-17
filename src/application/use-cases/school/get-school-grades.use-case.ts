import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { ICurrentUser } from 'src/core/types';

interface GetSchoolGradesUseCaseInput {
  data: {
    schoolId?: string;
    gradeIds?: number[];
  };
  user: ICurrentUser;
}

export class GetSchoolGradesUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: GetSchoolGradesUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const query = {
      schoolId: data.schoolId,
      gradeIds: data.gradeIds,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.STUDENT: {
        Object.assign(query, {
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(query, {
          schoolId: user.schoolId,
          classAssignments: user.classAssignments,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await schoolRepo.getSchoolGrades(query);
  }
}
