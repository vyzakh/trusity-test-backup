import { LookupRepository } from '@infrastructure/database';

export class GetGradesUseCase {
  constructor(
    private readonly dependencies: {
      lookupRepo: LookupRepository;
    },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    return await lookupRepo.findAllGrades();
  }
}
