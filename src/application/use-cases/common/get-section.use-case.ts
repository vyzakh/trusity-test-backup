import { LookupRepository } from '@infrastructure/database';

interface GetSectionUseCaseInput {
  data: {
    sectionId: number | null | undefined;
  };
}

export class GetSectionUseCase {
  constructor(
    private readonly dependencies: {
      lookupRepo: LookupRepository;
    },
  ) {}

  async execute(input: GetSectionUseCaseInput) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    if (!data.sectionId) return null;

    return await lookupRepo.getGradeSection({
      sectionId: data.sectionId,
    });
  }
}
