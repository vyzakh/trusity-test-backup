import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface GenerateLaunchRecommendationUseCaseInput {
  data: {
    businessId: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateLaunchRecommendationUseCase {
  constructor(private readonly dependencies: { amqpConnection: AmqpConnection; businessRepo: BusinessRepository }) {}

  async execute(input: GenerateLaunchRecommendationUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;

    const actionAt = genTimestamp().iso;

    const business = await businessRepo.getBusiness({
      businessId: data.businessId,
    });

    if (!business) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    // const response = await amqpConnection.request<{
    //   success: boolean;
    //   launch_recommendation: string;
    // }>({
    //   exchange: MSConfig.queues.launch.exchange,
    //   routingKey: MSConfig.queues.launch.routingKey,
    //   payload: {
    //     student: { grade: user.gradeAsText },
    //     business: {
    //       idea: business.idea,
    //       problemStatement: business.problemStatement,
    //       targetMarket: business.targetMarket,
    //       marketResearch: business.marketResearch,
    //       marketFit: business.marketFit,
    //       prototypeDescription: business.prototypeDescription,

    //       businessModel: {
    //         ...business.businessModel,
    //       },
    //       financialPlanning: {
    //         ...business.financialPlanDescription,
    //         ...business.risksAndMitigations,
    //         ...business.futurePlans,
    //       },
    //       brandingAndMarketing: {
    //         brandVoice: 'this the best brand voice',
    //         customerExperience: 'best customer expericne',
    //         marketing: 'marketings',
    //         competitorAnalysis: 'competitotrs',
    //       },
    //       pitch: {
    //         callToAction: 'some of the best call action ',
    //         narrative: 'this is the best narration',
    //         pitch: 'pitch is best',
    //       },
    //     },
    //   },
    //   timeout: MSConfig.queues.launch.timeout,
    // });
    //.......
    const response = await amqpConnection.request<{ success: boolean; launch_recommendation: string }>({
      exchange: MSConfig.queues.launch.exchange,
      routingKey: MSConfig.queues.launch.routingKey,
      payload: {
        student: { grade: '5' },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          targetMarket: business.targetMarket,
          marketResearch: business.marketResearch,
          marketFit: business.marketFit,
          prototypeDescription: business.prototypeDescription,

          businessModel: {
            channels: 'Online offline',
            keyPartners: 'Some partners',
            goalsAndKPIs: 'Revenue growth',
            keyResources: 'Tech team',
            costStructure: 'Cloud hosting',
            keyActivities: 'Development',
            revenueStreams: 'Subscriptions',
            customerSegments: 'SMEs',
            targetMarketSize: '1M users',
            valuePropositions: 'Affordable solution',
            customerRelationships: 'Self-service',
          },
          financialPlanning: {
            financialPlanDescription: 'some greate plans',
            risksAndMitigations: 'risks',
            futurePlans: 'there is fututre plans ',
          },
          brandingAndMarketing: {
            brandVoice: 'this the best brand voice',
            customerExperience: 'best customer expericne',
            marketing: 'marketings',
            competitorAnalysis: 'competitotrs',
          },
          pitch: {
            callToAction: 'some of the best call action ',
            narrative: 'this is the best narration',
            pitch: 'pitch is best',
          },
        },
      },
      timeout: MSConfig.queues.launch.timeout,
    });
    //.........

    if (!response.success) {
      throw new BadRequestException('The request could not be completed successfully. Please try again later or contact support if the issue continues.');
    }
    const updatedBusiness = await businessRepo.updateBusiness({
      businessId: data.businessId,
      launchRecommendation: response.launch_recommendation,
      updatedAt: actionAt,
    });

    if (!updatedBusiness) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }
    return updatedBusiness;
  }
}
