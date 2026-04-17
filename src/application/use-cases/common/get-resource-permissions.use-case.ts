import { LookupRepository } from '@infrastructure/database';

interface GetResourcePermissionsUseCaseInput {
  data: { resourceId: number };
}

export class GetResourcePermissionsUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute(input: GetResourcePermissionsUseCaseInput) {
    const { lookupRepo } = this.dependencies;
    const { resourceId } = input.data;

    const resourcePermissions = await lookupRepo.getResourcePermissions({
      resourceId,
    });

    return resourcePermissions;
  }
}
