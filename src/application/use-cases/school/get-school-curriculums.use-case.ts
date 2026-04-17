import { SchoolRepository } from '@infrastructure/database';

interface Input {
  data: { schoolId: string };
}

export class GetSchoolCarriculumsUseCase {
  constructor(
    private readonly dependencies: { schoolRepo: SchoolRepository },
  ) {}

  async execute(input: Input) {
    const { schoolRepo } = this.dependencies;
    const { data } = input;

    const schoolCarriculums = await schoolRepo.getSchoolCarriculums({
      schoolId: data.schoolId,
    });

    return schoolCarriculums;
  }
}
