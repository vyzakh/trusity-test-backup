import { PlatformUserRepository } from '@infrastructure/database';

interface GetPlatformUsersUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    name?: string;
  };
}

export class GetPlatformUsersUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: GetPlatformUsersUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      offset: data.offset,
      limit: data.limit,
      name: data.name,
    };

    return await platformUserRepo.getPlatformUsers(query);
  }
}
