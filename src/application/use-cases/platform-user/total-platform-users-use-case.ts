import { PlatformUserRepository } from '@infrastructure/database';

interface TotalPlatformUsersUseCaseInput {
  data: {
    name?: string;
  };
}

export class TotalPlatformUsersUseCase {
  constructor(private readonly dependencies: { platformUserRepo: PlatformUserRepository }) {}

  async execute(input: TotalPlatformUsersUseCaseInput) {
    const { platformUserRepo } = this.dependencies;
    const { data } = input;

    const query: Record<string, any> = {
      name: data.name,
    };

    return await platformUserRepo.countPlatformUsers(query);
  }
}
