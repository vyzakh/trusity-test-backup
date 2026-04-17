import { ChallengeRepository } from '@infrastructure/database';

interface GetChallengeTargetStudentsUseCaseInput {
  data: {
    challengeId: string;
    gradeId: number;
    sectionId: number;
  };
}

export class GetChallengeTargetStudentsUseCase {
  constructor(
    private readonly dependencies: {
      challengeRepo: ChallengeRepository;
    },
  ) {}

  async execute(input: GetChallengeTargetStudentsUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    return await challengeRepo.getChallengeTargetStudents({
      challengeId: data.challengeId,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
    });
  }
}
