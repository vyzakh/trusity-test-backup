import { LookupRepository } from '@infrastructure/database';

interface Input {
  data: { stateId: string };
}

export class GetCitiesUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    const cities = await lookupRepo.findCitiesByStateId({
      stateId: data.stateId,
    });

    return cities;
  }
}
