import { ICurrentUser } from '@core/types';
import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeUseCaseInput {
  data: { challengeId: string };
  user: ICurrentUser;
}

export class GetChallengeUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    const challenge = await challengeRepo.getChallengeById({
      challengeId: data.challengeId,
    });

    return challenge;
  }
}
