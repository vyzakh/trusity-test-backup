import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeTargetSectionsUseCaseInput {
  data: {
    challengeId: string;
    gradeId: number;
  };
}

export class GetChallengeTargetSectionsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetChallengeTargetSectionsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;
    return await challengeRepo.getChallengeTargetSections({
      challengeId: data.challengeId,
      gradeId: data.gradeId,
    });
  }
}
