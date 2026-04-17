import { ChallengeRepository } from '@infrastructure/database';

interface GetAssignedChallengesUseCaseInput {
  data: {
    offset?: number;
    limit?: number;
    studentId: string;
  };
}

export class GetAssignedChallengesUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetAssignedChallengesUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    return await challengeRepo.getAssignedChallenges({
      offset: data.offset,
      limit: data.limit,
      studentId: data.studentId,
      showActiveAssignmentsOnly: true,
    });
  }
}
