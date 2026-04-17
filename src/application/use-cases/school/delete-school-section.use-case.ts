import { ICurrentUser } from '@core/types';
import { SchoolRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface DeleteSchoolSectionUseCaseInput {
  data: {
    schoolId?: string | null;
    gradeId: number;
    sectionId: number;
  };
  user: ICurrentUser;
}

export class DeleteSchoolSectionUseCase {
  constructor(
    private readonly deps: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute(input: DeleteSchoolSectionUseCaseInput) {
    const payload: Record<string, any> = {
      gradeId: input.data.gradeId,
      sectionId: input.data.sectionId,
    };

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        Object.assign(payload, {
          schoolId: input.data.schoolId,
        });
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    await this.deps.schoolRepo.deleteSchoolSection(payload);
  }
}
