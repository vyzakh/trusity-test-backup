import { LookupRepository } from '@infrastructure/database';

export class GetPrototypeOptionsUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute() {
    const { lookupRepo } = this.dependencies;

    return await lookupRepo.getPrototypeOptions();
  }
}
