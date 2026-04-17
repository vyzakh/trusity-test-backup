import { StudentRepository } from '@infrastructure/database';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

interface GetStudentCurrentAcademicYearUseCaseInput {
  data: {
    studentId: string;
  };
}

export class GetStudentCurrentAcademicYearUseCase {
  constructor(
    private readonly deps: {
      studentRepo: StudentRepository;
    },
  ) {}

  async execute(input: GetStudentCurrentAcademicYearUseCaseInput) {
    const { data } = input;

    return await this.deps.studentRepo.getAcademicYear({
      studentId: data.studentId,
      enrollmentStatus: EnrollmentStatusEnum.ACTIVE,
    });
  }
}
