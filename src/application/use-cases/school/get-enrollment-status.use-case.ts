import { SchoolRepository } from '@infrastructure/database';


export class GetEnrollmentStatusUseCase {
  constructor(
    private readonly dependencies: {
      schoolRepo: SchoolRepository;
    },
  ) {}

  async execute() {
    const { schoolRepo } = this.dependencies;

    return await schoolRepo.getEnrollmentStatus();
  }
}
