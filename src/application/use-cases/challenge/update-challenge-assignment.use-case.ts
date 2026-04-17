import { ChallengeRepository } from '@infrastructure/database';

interface UpdateChallengeAssignmentUseCaseInput {
  data: {
    challengeId: string;
    schoolId: string;
    isEntire: boolean;
    gradeIds?: string[];
  };
}

export class UpdateChallengeAssignmentUseCase {
  constructor(private readonly dependencies: { challengeRepo: ChallengeRepository }) {}

  async execute(input: UpdateChallengeAssignmentUseCaseInput) {
    const { challengeRepo } = this.dependencies;
    const { data } = input;

    await challengeRepo.unassignChallengeFromSchool({
      challengeId: data.challengeId,
      schoolId: data.schoolId,
    });

    if (!data.isEntire && data.gradeIds?.length) {
      const gradeAssignments = data.gradeIds.map((gradeId) => ({
        challengeId: data.challengeId,
        schoolId: data.schoolId,
        gradeId,
        isEntire: true,
      }));
    }
  }
}
