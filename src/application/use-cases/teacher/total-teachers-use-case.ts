import { ICurrentUser } from '@core/types';
import { TeacherRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';

interface TotalTeachersUseCaseInput {
  data: {
    name?: string;
    schoolId?: string;
    gradeId?: number;
    sectionId?: number;
  };
  user: ICurrentUser;
}

export class TotalTeachersUseCase {
  constructor(private readonly dependencies: { teacherRepo: TeacherRepository }) {}

  async execute(input: TotalTeachersUseCaseInput) {
    const { teacherRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      name: data.name,
      schoolId: data.schoolId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
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

    return await teacherRepo.countTeachers(payload);
  }
}
