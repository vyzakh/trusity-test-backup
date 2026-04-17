import { LookupRepository } from '@infrastructure/database';

export class GetResourcesUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    const resources = await lookupRepo.getResources();

    return resources;
  }
}
