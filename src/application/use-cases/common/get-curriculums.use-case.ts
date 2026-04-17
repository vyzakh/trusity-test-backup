import { LookupRepository } from '@infrastructure/database';

export class GetCurriculumsUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const curriculums = await lookupRepo.findAllCurriculums();

    return curriculums;
  }
}
