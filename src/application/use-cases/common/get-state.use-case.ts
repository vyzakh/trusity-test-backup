import { LookupRepository } from '@infrastructure/database';
import { isDefinedStrict } from '@shared/utils';

interface Input {
  data: { stateId?: string | null };
}

export class GetStateUseCase {
  constructor(
    private readonly dependencies: { lookupRepo: LookupRepository },
  ) {}

  async execute(input: Input) {
    const { lookupRepo } = this.dependencies;
    const { data } = input;

    if (!isDefinedStrict(data.stateId)) {
      return null;
    }

    const state = await lookupRepo.findState({ stateId: data.stateId });

    return state;
  }
}
