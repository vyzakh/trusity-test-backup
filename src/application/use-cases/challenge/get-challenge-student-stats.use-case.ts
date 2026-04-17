import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeStudentStatsUseCaseInput {
  data: { challengeId: string };
}

export class GetChallengeStudentStatsUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: GetChallengeStudentStatsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    const challengeStudentStats = await challengeRepo.getChallengeStudentStatsById({ challengeId: data.challengeId });

    return challengeStudentStats;
  }
}
