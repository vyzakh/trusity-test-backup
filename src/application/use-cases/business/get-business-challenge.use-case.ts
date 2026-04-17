import { ChallengeRepository } from '@infrastructure/database';

interface GetBusinessChallengeUseCaseInput {
  data: { challengeId?: string | null };
}

export class GetBusinessChallengeUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetBusinessChallengeUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    if (!data.challengeId) return null;

    const challenge = await challengeRepo.getChallengeById({ challengeId: data.challengeId });

    return challenge;
  }
}
