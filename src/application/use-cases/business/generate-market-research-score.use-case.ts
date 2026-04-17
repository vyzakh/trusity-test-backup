import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface SaveMarketResearchUseCaseInput {
  data: {
    businessId: string;
    marketResearchData: string;
    competitors: string;
    questions: { slNo: number; question: string; yesCount: number; noCount: number; yesPercentage: number; noPercentage: number }[];
    summary: string;
  };
  user: ICurrentStudentUser;
}

export class SaveMarketResearchUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: SaveMarketResearchUseCaseInput) {
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
      score: number;
    }>({
      exchange: MSConfig.queues.marketResearch.exchange,
      routingKey: MSConfig.queues.marketResearch.routingKey,
      payload: {
        student: { grade: user.gradeName },
        business: {
          idea: business.idea,
          problemStatement: business.problemStatement,
          marketResearch: business.marketResearch,
          targetMarket: business.targetMarket,
          summary: data.summary,
          sdgs: business.sdgsText,
          type: 'score',
        },
      },
      timeout: MSConfig.queues.marketResearch.timeout,
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }
    if (!businessProgressScore.marketResearch && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }
    if (response.score < (businessProgressScore.marketResearch ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.marketResearch ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }

    await businessRepo.updateBusinessProgressScore({
      ...businessQuery,
      marketResearchScore: response.score,
      updatedAt: actionAt,
    });

    await businessRepo.updateBusinessProgressStatus({
      ...businessQuery,
      marketResearchStatus: true,
      updatedAt: actionAt,
    });

    return await businessRepo.updateBusiness({
      ...businessQuery,
      marketResearchData: sanitizeInput(data.marketResearchData),
      marketCompetitors: sanitizeInput(data.competitors),
      marketQuestionnaire: JSON.stringify(data.questions.map((q) => ({ ...q, question: sanitizeInput(q.question) }))),
      marketSummary: sanitizeInput(data.summary),
      updatedAt: actionAt,
    });
  }
}
