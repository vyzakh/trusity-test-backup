import { ICurrentUser } from '@core/types';
import { BusinessRepository } from '@infrastructure/database';
import { normalizeNumber } from '@shared/utils';

interface GetBusinessPerformanceReportUseCaseInput {
  data: {
    businessId: string;
  };
  user: ICurrentUser;
}

export class GetBusinessPerformanceReportUseCase {
  constructor(private readonly dependencies: { businessRepo: BusinessRepository }) {}

  async execute(input: GetBusinessPerformanceReportUseCaseInput) {
    const { businessRepo } = this.dependencies;
    const { data, user } = input;

    const [businessProgressScore, business] = await Promise.all([
      businessRepo.getBusinessProgressScore({
        businessId: data.businessId,
      }),
      businessRepo.getBusiness({
        businessId: data.businessId,
      }),
    ]);

    if (!business || !businessProgressScore) {
      return null;
    }

    const averageIScore =
      (normalizeNumber(businessProgressScore.problemStatement) +
        normalizeNumber(businessProgressScore.marketResearch) +
        normalizeNumber(businessProgressScore.marketFit) +
        normalizeNumber(businessProgressScore.prototype)) /
      4;

    const averageEScore =
      (normalizeNumber(businessProgressScore.businessModel) + normalizeNumber(businessProgressScore.financialProjections) + normalizeNumber(businessProgressScore.marketing)) / 3;

    const averageCScore = normalizeNumber(businessProgressScore.pitchFeedback);

    return {
      innovation: {
        stages: {
          problemStatementScore: normalizeNumber(businessProgressScore.problemStatement),
          marketResearchScore: normalizeNumber(businessProgressScore.marketResearch),
          marketFitScore: normalizeNumber(businessProgressScore.marketFit),
          prototypeScore: normalizeNumber(businessProgressScore.prototype),
        },
        averageScore: averageIScore,
      },
      entrepreneurship: {
        stages: {
          businessModelScore: normalizeNumber(businessProgressScore.businessModel),
          financialPlanningScore: normalizeNumber(businessProgressScore.financialProjections),
          marketingScore: normalizeNumber(businessProgressScore.marketing),
        },
        averageScore: averageEScore,
      },
      communication: {
        stages: {
          pitchDeckScore: normalizeNumber(businessProgressScore.pitchFeedback),
        },
        averageScore: averageCScore,
      },
      investment: {
        pitchStatement: business.investment?.fundPitchStatement?.pitchStatement || '',
      },
      launch: {
        recommendation: business.launchRecommendation || '',
      },
      averageOverallScore: (averageIScore + averageEScore + averageCScore) / 3,
    };
  }
}
