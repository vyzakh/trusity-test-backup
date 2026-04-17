import { LookupRepository } from '@infrastructure/database';

export class GetSectionsUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const sections = await lookupRepo.findAllSections();

    return sections;
  }
}
