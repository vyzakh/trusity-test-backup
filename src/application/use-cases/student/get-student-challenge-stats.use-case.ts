import { StudentRepository } from '@infrastructure/database';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

interface GetStudentChallengeStatsUseCaseInput {
  data: {
    studentId: string;
  };
}

export class GetStudentChallengeStatsUseCase {
  constructor(private readonly dependencies: { studentRepo: StudentRepository }) {}

  async execute(input: GetStudentChallengeStatsUseCaseInput) {
    const { studentRepo } = this.dependencies;
    const { data } = input;

    return await studentRepo.getStudentChallengeStats({ studentId: data.studentId, enrollmentStatus: EnrollmentStatusEnum.ACTIVE });
  }
}
