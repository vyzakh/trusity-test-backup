import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeTargetGradesUseCaseInput {
  data: {
    challengeId: string;
  };
}

export class GetChallengeTargetGradesUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetChallengeTargetGradesUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    return await challengeRepo.getChallengeTargetGrades({
      challengeId: data.challengeId,
    });
  }
}
