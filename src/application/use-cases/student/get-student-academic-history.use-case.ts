import { StudentRepository } from '@infrastructure/database';
import { UserScope } from '@shared/enums';
import { ForbiddenException } from '@shared/execeptions';
import { ICurrentUser } from 'src/core/types';

interface GetStudentAcademicHistoryUseCaseInput {
  data: {
    studentId?: string | null;
  };
  user: ICurrentUser;
}

export class GetStudentAcademicHistoryUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: GetStudentAcademicHistoryUseCaseInput) {
    const payload: Record<string, any> = {
      studentId: input.data.studentId,
    };

    switch (input.user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload, {
          schoolId: input.user.schoolId,
          studentId: input.user.id,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await this.deps.studentRepo.getStudentEnrollments(payload);
  }
}
