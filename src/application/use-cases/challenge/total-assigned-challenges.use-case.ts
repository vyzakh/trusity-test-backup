import { ChallengeRepository } from '@infrastructure/database';

interface TotalAssignedChallengesUseCaseInput {
  data: {
    studentId: string;
  };
}

export class TotalAssignedChallengesUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: TotalAssignedChallengesUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    return await challengeRepo.countChallengeAssignemnts({
      studentId: data.studentId,
      showActiveAssignmentsOnly: true,
    });
  }
}
