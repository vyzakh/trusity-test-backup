import { SchoolRepository } from '@infrastructure/database';
import { BusinessStatus } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';

interface GetAverageBusinessScoresUseCaseInput {
  data: {
    schoolId?: string;
    studentId?: string;
    businessStatus?: BusinessStatus;
    enrollmentStatus?: EnrollmentStatusEnum;
  };
}

export class GetAverageBusinessScoresUseCase {
  constructor(private readonly dependencies: { schoolRepo: SchoolRepository }) {}

  async execute(input: GetAverageBusinessScoresUseCaseInput) {
    const { schoolRepo } = this.dependencies;
    const { data } = input;

    return await schoolRepo.getAverageBusinessScores({
      ...data,
      enrollmentStatus: data.enrollmentStatus ?? EnrollmentStatusEnum.ACTIVE,
    });
  }
}
