import { StudentRepository } from '@infrastructure/database';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { isDefinedStrict } from '@shared/utils/common.util';

interface GetStudentSectionUseCaseInput {
  data: {
    studentId: string;
    enrollmentStatus?: EnrollmentStatusEnum;
    academicYearId?: string;
  };
}

export class GetStudentSectionUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: GetStudentSectionUseCaseInput) {
    const payload: Record<string, any> = {
      studentId: input.data.studentId,
      enrollmentStatus: input.data.enrollmentStatus,
      academicYearId: input.data.academicYearId,
    };

    if (!isDefinedStrict(input.data.academicYearId)) {
      Object.assign(payload, {
        enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
      });
    }

    return await this.deps.studentRepo.getStudentSection(payload);
  }
}
