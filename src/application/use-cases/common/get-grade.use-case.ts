import { LookupRepository } from '@infrastructure/database';

interface GetGradeUseCaseInput {
  data: {
    gradeId: number | null | undefined;
  };
}

export class GetGradeUseCase {
  constructor(
    private readonly dependencies: {
      lookupRepo: LookupRepository;
    },
  ) {}

  async execute(input: GetGradeUseCaseInput) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    if (!data.gradeId) return null;

    return await lookupRepo.getGrade({
      gradeId: data.gradeId,
    });
  }
}
