import { BusinessRepository, EnrollmentRepository } from '@infrastructure/database';

interface GetBusinessProgressPercentageUseCaseInput {
  data: {
    businessId: string;
  };
}

export class GetBusinessProgressPercentageUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; enrollmentRepo: EnrollmentRepository }) {}

  async execute(input: GetBusinessProgressPercentageUseCaseInput) {
    const { businessRepo, enrollmentRepo } = this.dependencies;
    const { data } = input;

    const businessQuery = {
      businessId: data.businessId,
    };

    const businessProgressStatus = await businessRepo.getBusinessProgressStatus(businessQuery);

    if (!businessProgressStatus) return null;

    const business = await businessRepo.getBusiness(businessQuery);
    const businessGrade = await enrollmentRepo.getStudentGrade({
      studentId: business?.studentId,
      academicYearId: business?.academicYearId,
    });

    const keys = Object.keys(businessProgressStatus);
    let filteredKeys = keys;
    if (!(businessGrade?.id === 5 || businessGrade?.id === 7)) {
      filteredKeys = keys.filter((k) => k.toLowerCase() !== 'ebitda');
    }

    const totalBusinessStages = filteredKeys.length;
    const completedBusinessStages = filteredKeys.filter((k) => !!businessProgressStatus[k]).length;

    return totalBusinessStages > 0 ? Math.round((completedBusinessStages / totalBusinessStages) * 100) : 0;
  }
}
