import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, NotFoundException } from '@shared/execeptions';
import { genTimestamp } from '@shared/utils';

interface GenerateMarketResearchQuestionsUseCaseInput {
  data: {
    businessId: string;
    targetMarket: string;
    marketResearch: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateMarketResearchQuestionsUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GenerateMarketResearchQuestionsUseCaseInput) {
    const { amqpConnection, businessRepo } = this.dependencies;
    const { data, user } = input;
    const actionAt = genTimestamp().iso;

    switch (user.scope) {
      case UserScope.STUDENT: {
        break;
      }
      default: {
        throw new ForbiddenException('You are not allowed to perform this action.');
      }
    }

    const businessQuery = {
      businessId: data.businessId,
      schoolId: user.schoolId,
      studentId: user.id,
    };

    const business = await businessRepo.getBusiness(businessQuery);
    if (!business) {
      throw new NotFoundException('The requested business could not be found.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      message: string;
      questions: string[];
    }>({
      exchange: MSConfig.queues.marketResearch.exchange,
      routingKey: MSConfig.queues.marketResearch.routingKey,
      payload: {
        student: { grade: user.gradeName },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          marketResearch: data.marketResearch,
          targetMarket: data.targetMarket,
          sdgs: business.sdgsText,
          type: 'questions',
        },
      },
      timeout: MSConfig.queues.marketResearch.timeout,
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }

    const marketQuestionnaire = response.questions.map((question, index) => ({
      slNo: index + 1,
      question: question,
      yesCount: 0,
      noCount: 0,
      yesPercentage: 0,
      noPercentage: 0,
    }));

    return await businessRepo.updateBusiness({
      ...businessQuery,
      marketQuestionnaire: JSON.stringify(marketQuestionnaire),
      updatedAt: actionAt,
    });
  }
}
