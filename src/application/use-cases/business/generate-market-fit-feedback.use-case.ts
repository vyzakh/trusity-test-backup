import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface GenerateMarketFitFeedbackUseCaseInput {
  data: {
    businessId: string;
    marketFit: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateMarketFitFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GenerateMarketFitFeedbackUseCaseInput) {
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

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);
    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      message: string;
      feedback: string;
      score: number;
    }>({
      exchange: MSConfig.queues.marketFit.exchange,
      routingKey: MSConfig.queues.marketFit.routingKey,
      payload: {
        student: { grade: user.gradeName },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          targetMarket: business.targetMarket,
          marketResearch: business.marketResearch,
          marketFit: data.marketFit,
          sdgs: business.sdgsText,
        },
      },
      timeout: MSConfig.queues.marketFit.timeout,
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }
    if (!businessProgressScore.marketFit && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }
    if (response.score < (businessProgressScore.marketFit ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.marketFit ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }

    await businessRepo.updateBusinessProgressScore({
      ...businessQuery,
      marketFitScore: response.score,
      updatedAt: actionAt,
    });

    return await businessRepo.updateBusiness({
      ...businessQuery,
      marketFit: sanitizeInput(data.marketFit),
      marketFitFeedback: response.feedback,
      updatedAt: actionAt,
    });
  }
}
