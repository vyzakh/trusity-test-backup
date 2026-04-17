import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetTeacherGradeSectionsUseCaseInput {
  data: {
    teacherId: string;
    gradeId: number;
  };
  user: ICurrentUser;
}

export class GetTeacherGradeSectionsUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: GetTeacherGradeSectionsUseCaseInput) {
    const { teacherRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      teacherId: data.teacherId,
      gradeId: data.gradeId,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          teacherId: user.id,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await teacherRepo.getTeacherGradeSections(payload);
  }
}
