import { ICurrentUser } from '@core/types';
import { StudentRepository } from '@infrastructure/database';
import { BusinessModelEnum, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ForbiddenException } from '@shared/execeptions';

interface GetStudentUseCaseInput {
  data: {
    studentId?: string;
  };
  user: ICurrentUser;
}

export class GetStudentUseCase {
  constructor(
    private readonly dependencies: {
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: GetStudentUseCaseInput) {
    const { studentRepo } = this.dependencies;
    const { data, user } = input;

    const payload = {
      studentId: data.studentId,
      enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
    };

    switch (user.scope) {
      case UserScope.PLATFORM_USER: {
        break;
      }
      case UserScope.SCHOOL_ADMIN:
      case UserScope.TEACHER: {
        Object.assign(payload, {
          schoolId: user.schoolId,
          accountType: BusinessModelEnum.B2B,
        });
        break;
      }
      case UserScope.STUDENT: {
        Object.assign(payload,{
          studentId: user.id,
        });
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    return await studentRepo.getStudent(payload);
  }
}
