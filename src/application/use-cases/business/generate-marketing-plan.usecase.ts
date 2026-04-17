import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException, InformationException, NotFoundException } from '@shared/execeptions';
import { ICurrentStudentUser } from 'src/core/types';

interface GenerateMarketPlanUseCaseInput {
  data: {
    businessId: string;
    marketing: string;
    competitorAnalysis: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateMarketPlanUseCase {
  constructor(
    private readonly dependencies: {
      businessRepo: BusinessRepository;
      amqpConnection: AmqpConnection;
    },
  ) {}

  async execute(input: GenerateMarketPlanUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;
    const { businessId, marketing, competitorAnalysis } = data;

    const business = await businessRepo.getBusiness({ businessId });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);

    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      score: number;
      feedback: string;
      message: string;
    }>({
      exchange: MSConfig.queues.marketPlan.exchange,
      routingKey: MSConfig.queues.marketPlan.routingKey,
      timeout: MSConfig.queues.marketPlan.timeout,
      payload: {
        student: {
          grade: user.gradeName,
        },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          targetMarket: business.targetMarket,
          marketResearch: business.marketResearch,
          marketFit: business.marketFit,
          prototypeDescription: business.prototypeDescription,
          businessModel: business.businessModel,
          financialPlanning: {
            financialPlanDescription: business.financialProjectionsDescription,
            risksAndMitigations: business.risksAndMitigations,
            futurePlans: business.futurePlans,
          },
          brandingAndMarketing: {
            brandVoice: business.branding?.brandVoice,
            customerExperience: business.customerExperience,
            marketing: marketing,
            competitorAnalysis: competitorAnalysis,
          },
        },
      },
    });
    if (!response.success) {
      throw new BadRequestException(response.message);
    }

    if (!businessProgressScore.marketing && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }

    if (response.score < (businessProgressScore.marketing ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.marketing ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }

    return {
      score: response.score,
      feedback: response.feedback,
    };
  }
}
