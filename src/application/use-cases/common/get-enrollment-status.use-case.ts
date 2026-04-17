import { LookupRepository } from '@infrastructure/database';

interface GetEnrollmentStatusUseCaseInput {
  data: {
    enrollmentStatusId: number;
  };
}

export class GetEnrollmentStatusUseCase {
  constructor(
    private readonly deps: {
      lookupRepo: LookupRepository;
    },
  ) {}

  async execute(input: GetEnrollmentStatusUseCaseInput) {
    const payload: Record<string, any> = {
      enrollmentStatusId: input.data.enrollmentStatusId,
    };

    return await this.deps.lookupRepo.getEnrollmentStatus(payload);
  }
}
