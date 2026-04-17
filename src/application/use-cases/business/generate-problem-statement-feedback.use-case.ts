import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessPhaseLockRepository, BusinessRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface GenerateProblemStatementFeedbackUseCaseInput {
  data: {
    businessId: string;
    problemStatement: string;
  };
  user: ICurrentStudentUser;
}

export class GenerateProblemStatementFeedbackUseCase {
  constructor(
    private readonly dependencies: {
      amqpConnection: AmqpConnection;
      businessRepo: BusinessRepository;
    },
  ) {}

  async execute(input: GenerateProblemStatementFeedbackUseCaseInput) {
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
      tips: string;
      score: number;
    }>({
      exchange: MSConfig.queues.problemStatement.exchange,
      routingKey: MSConfig.queues.problemStatement.routingKey,
      payload: {
        student: { grade: user.gradeName },
        business: {
          idea: business.idea,
          sdgs: business.sdgsText,
          problemStatment: data.problemStatement,
        },
      },
      timeout: MSConfig.queues.problemStatement.timeout,
    });

    if (!response.success) {
      const errorMsg = response.message || response.tips;
      throw new BadRequestException(errorMsg);
    }
    if (!businessProgressScore.problemStatement && response.score === 0) {
      throw new InformationException('Elaborate more on the project idea. Please try again to achieve a higher score');
    }
    if (response.score < (businessProgressScore.problemStatement ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.problemStatement ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }

    await businessRepo.updateBusinessProgressScore({
      ...businessQuery,
      problemStatementScore: response.score,
      updatedAt: actionAt,
    });

    await businessRepo.updateBusinessProgressStatus({
      ...businessQuery,
      problemStatementStatus: true,
      updatedAt: actionAt,
    });

    return await businessRepo.updateBusiness({
      ...businessQuery,
      problemStatement: sanitizeInput(data.problemStatement),
      problemStatementFeedback: response.tips,
      updatedAt: actionAt,
    });
  }
}
