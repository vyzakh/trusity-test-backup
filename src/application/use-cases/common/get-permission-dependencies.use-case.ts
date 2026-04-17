import { LookupRepository } from '@infrastructure/database';

interface GetPermissionDependenciesUseCaseInput {
  data: { permissionId: number };
}

export class GetPermissionDependenciesUseCase {
  constructor(private readonly dependencies: { lookupRepo: LookupRepository }) {}

  async execute(input: GetPermissionDependenciesUseCaseInput) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    return await lookupRepo.getPermissionDependencies({
      permissionId: data.permissionId,
    });
  }
}
