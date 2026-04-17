import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetTeacherUseCaseInput {
  data: {
    teacherId: string;
  };
  user: ICurrentUser;
}

export class GetTeacherUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: GetTeacherUseCaseInput) {
    const { teacherRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      teacherId: data.teacherId,
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
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await teacherRepo.getTeacher(payload);
  }
}
