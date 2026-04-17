import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, LookupRepository } from '@infrastructure/database';
import { MSConfig } from '@infrastructure/microservice';
import { UserScope } from '@shared/enums';
import { BadRequestException, ForbiddenException, InformationException, NotFoundException } from '@shared/execeptions';
import { genTimestamp, sanitizeInput } from '@shared/utils';

interface GeneratePrototypeSuggestionsUseCaseInput {
  data: {
    businessId: string;
    prototypeOptionId: number;
    description: string;
  };
  user: ICurrentStudentUser;
}

export class GeneratePrototypeSuggestionsUseCase {
  constructor(private readonly dependencies: { amqpConnection: AmqpConnection; businessRepo: BusinessRepository; lookupRepo: LookupRepository }) {}

  async execute(input: GeneratePrototypeSuggestionsUseCaseInput) {
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
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    const businessProgressScore = await businessRepo.getBusinessProgressScore(businessQuery);
    if (!businessProgressScore) {
      throw new NotFoundException('The progress details for this business could not be found.');
    }

    const prototypeOption = await businessRepo.getPrototypeOption({
      prototypeOptionId: data.prototypeOptionId,
    });
    if (!prototypeOption) {
      throw new NotFoundException('The selected prototype option is invalid.');
    }

    const response = await amqpConnection.request<{
      success: boolean;
      message: string;
      prototypes: string[];
      score: number;
    }>({
      exchange: MSConfig.queues.prototype.exchange,
      routingKey: MSConfig.queues.prototype.routingKey,
      payload: {
        business: {
          businessId: business.id,
          idea: business.idea,
          problemStatement: business.problemStatement,
          marketResearch: business.marketResearch,
          targetMarket: business.targetMarket,
          marketFit: business.marketFit,
          sdgs: business.sdgsText,
        },
        prototypeOption: prototypeOption.name,
        description: data.description,
        prototypeCount: prototypeOption.prototypeCount,
      },
      timeout: MSConfig.queues.prototype.timeout,
    });

    if (!response.success) {
      throw new BadRequestException(response.message);
    }
    if (!businessProgressScore.prototype && response.score === 0) {
      throw new InformationException('A score of zero cannot be saved. Please try again to achieve a higher score.');
    }
    if (response.score < (businessProgressScore.prototype ?? 0)) {
      throw new InformationException(
        `Your new score (${response.score}) is less than your earlier score (${businessProgressScore.prototype ?? 0}), so it won’t be updated. Keep your best score, and feel free to try again!`,
      );
    }

    await businessRepo.updateBusinessProgressScore({
      ...businessQuery,
      prototypeScore: response.score,
      updatedAt: actionAt,
    });

    await businessRepo.updateBusiness({
      ...businessQuery,
      prototypeOption: JSON.stringify({
        id: prototypeOption.id,
        name: prototypeOption.name,
      }),
      prototypeDescription: sanitizeInput(data.description),
      updatedAt: actionAt,
    });

    return {
      prototypeImages: response.prototypes,
    };
  }
}
