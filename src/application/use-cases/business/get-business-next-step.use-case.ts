import { BusinessRepository, EnrollmentRepository } from '@infrastructure/database';

interface GetBusinessNextStepUseCaseInput {
  data: {
    businessId: string;
  };
}

export class GetBusinessNextStepUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository; enrollmentRepo: EnrollmentRepository }) {}

  async execute(input: GetBusinessNextStepUseCaseInput) {
    const { businessRepo, enrollmentRepo } = this.dependencies;
    const { data } = input;

    const businessQuery = {
      businessId: data.businessId,
    };

    const progressStatus = await businessRepo.getBusinessProgressStatus(businessQuery);
    if (!progressStatus) {
      return null;
    }

    const business = await businessRepo.getBusiness(businessQuery);

    const businessGrade = await enrollmentRepo.getStudentGrade({
      studentId: business?.studentId,
      academicYearId: business?.academicYearId,
    });

    let orderedSteps = [
      { phase: 'innovation', step: 'ideate', key: 'ideate' },
      { phase: 'innovation', step: 'problem-statement', key: 'problemStatement' },
      { phase: 'innovation', step: 'market-research', key: 'marketResearch' },
      { phase: 'innovation', step: 'market-fit', key: 'marketFit' },
      { phase: 'innovation', step: 'prototype', key: 'prototype' },

      { phase: 'entrepreneurship', step: 'business-model', key: 'businessModel' },
      { phase: 'entrepreneurship', step: 'revenue-model', key: 'revenueModel' },
      { phase: 'entrepreneurship', step: 'capex', key: 'capex' },
      { phase: 'entrepreneurship', step: 'opex', key: 'opex' },
      { phase: 'entrepreneurship', step: 'financial-projections', key: 'financialProjections' },
    ];

    if (businessGrade?.id === 5 || businessGrade?.id === 7) {
      orderedSteps.push({ phase: 'entrepreneurship', step: 'ebitda', key: 'ebitda' }, { phase: 'entrepreneurship', step: 'branding', key: 'branding' });
    } else {
      orderedSteps.push({ phase: 'entrepreneurship', step: 'branding', key: 'branding' });
    }

    orderedSteps = orderedSteps.concat([
      { phase: 'entrepreneurship', step: 'marketing', key: 'marketing' },

      { phase: 'communication', step: 'pitch-deck', key: 'pitchDeck' },
      { phase: 'communication', step: 'pitch-script', key: 'pitchScript' },
      { phase: 'communication', step: 'pitch-feedback', key: 'pitchFeedback' },
    ]);

    const nextStep = orderedSteps.find(({ key }) => !progressStatus[key]);

    if (!nextStep) return null;

    const responseStep = { ...nextStep };

    return responseStep;
  }
}
