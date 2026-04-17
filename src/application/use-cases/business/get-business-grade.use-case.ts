import { EnrollmentRepository } from '@infrastructure/database';

interface GetBusinessGradeUseCaseInput {
  data: {
    studentId: string;
    academicYearId: string;
  };
}

export class GetBusinessGradeUseCase {
  constructor(
    private readonly dependencies: {
      enrollmentRepo: EnrollmentRepository;
    },
  ) {}

  async execute(input: GetBusinessGradeUseCaseInput) {
    const { enrollmentRepo } = this.dependencies;
    const { data } = input;

    return await enrollmentRepo.getStudentGrade(data);
  }
}
