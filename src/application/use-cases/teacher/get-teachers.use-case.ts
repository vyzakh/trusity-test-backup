import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface GetTeachersUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    schoolId?: string;
    name?: string;
  };
  user: ICurrentUser;
}

export class GetTeachersUseCase {
  constructor(
    private readonly dependencies: {
      teacherRepo: TeacherRepository;
    },
  ) {}

  async execute(input: GetTeachersUseCaseInput) {
    const { teacherRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      schoolId: data.schoolId,
      name: data.name,
      offset: data.offset,
      limit: data.limit,
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
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await teacherRepo.getTeachers(payload);
  }
}
