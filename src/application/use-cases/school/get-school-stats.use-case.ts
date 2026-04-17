import { SchoolRepository } from '@infrastructure/database';

interface Input {
  data: {
    schoolId?: string;
  };
}

export class GetSchoolStatsUseCase {
  constructor(private readonly dependencies: { schoolRepo: SchoolRepository }) {}

  async execute(input: Input) {
    const { schoolRepo } = this.dependencies;
    const { data } = input;

    const schoolStats = await schoolRepo.getSchoolStats({
      schoolId: data.schoolId,
    });

    return schoolStats;
  }
}
