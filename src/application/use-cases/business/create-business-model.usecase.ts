import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { BadRequestException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface CreateBusinessModelUseCaseInput {
  data: {
    businessId: string;
    keyPartners: string;
    customerSegments: string;
    valuePropositions: string;
    channels: string;
    customerRelationships: string;
    revenueStreams: string;
    keyResources: string;
    keyActivities: string;
    costStructure: string;
    targetMarketSize: string;
    goalsAndKPIs: string;
  };
  user: ICurrentStudentUser;
}

export class CreateBusinessModelUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: CreateBusinessModelUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;
    const { businessId, ...rest } = data;

    const actionAt = genTimestamp().iso;

    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const business = await businessRepo.getBusiness(businessQuery);
    if (!business) {
      throw new NotFoundException('The requested business could not be found.');
    }

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);
    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      score: number;
      message: string;
    }>({
      exchange: MSConfig.queues.businessModel.exchange,
      routingKey: MSConfig.queues.businessModel.routingKey,
      timeout: MSConfig.queues.businessModel.timeout,
      payload: {
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          targetMarket: business.targetMarket,
          marketResearch: business.marketResearch,
          marketFit: business.marketFit,
          prototypeDescription: business.prototypeDescription,
          sdgs: business.sdgsText,
          businessModel: rest,
        },
        student: { grade: user.gradeName },
      },
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }
    if (!businessProgressScore.businessModel && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }
    if (response.score < (businessProgressScore.businessModel ?? 0)) {
      throw new InformationException('Your new score is less than your earlier score, so it won’t be updated. Keep your best score, and feel free to try again!');
    }

    const [updatedBusiness] = await Promise.all([
      businessRepo.updateBusiness({
        ...businessQuery,
        businessModel: JSON.stringify(rest),
        updatedAt: actionAt,
      }),
      businessRepo.updateBusinessProgressScore({
        ...businessQuery,
        businessModelScore: response.score,
        updatedAt: actionAt,
      }),
      businessRepo.updateBusinessProgressStatus({
        ...businessQuery,
        businessModelStatus: true,
        updatedAt: actionAt,
      }),
    ]);

    return updatedBusiness;
  }
}
