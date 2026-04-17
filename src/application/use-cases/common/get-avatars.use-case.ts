import { LookupRepository } from "@infrastructure/database";


interface GetAvatarsUseCaseInput {
  data: {
    countryId: string;
  };
}
export class GetAvatarsUseCase{
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}
  async execute(input : GetAvatarsUseCaseInput) {
    const { lookupRepo } = this.dependencies;
    const {data} = input;
    const avatars = await lookupRepo.getAvatars(data);
    return avatars;
  }
}