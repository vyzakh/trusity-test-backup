import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetSchoolSectionsUseCaseInput {
  data: {
    schoolId?: string;
    gradeId: number;
    sectionIds?: number[];
  };
  user: ICurrentUser;
}

export class GetSchoolSectionsUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: GetSchoolSectionsUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data, user } = input;

    const query: Record<string, any> = {
      gradeId: data.gradeId,
      sectionIds: data.sectionIds,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(query, {
          schoolId: data.schoolId,
        });
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

    return await schoolRepo.getSchoolGradeSections(query);
  }
}
