import { GenerateMarketPlanUseCase } from '@application/use-cases/business/generate-marketing-plan.usecase';
import { SaveMarketPlanUseCase } from '@application/use-cases/business/save-marketing.usecase';
import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { GenerateMarketPlan, SaveMarketPlan } from './schemas/market-plan.schema';
import { GenerateMarketPlanInput, GenerateMarketPlanResponse, SaveMarketPlanInput } from './types/marketing.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class MarketPlanResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => GenerateMarketPlanResponse)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKETING)
  async generateMarketPlan(@Args('input') input: GenerateMarketPlanInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateMarketPlan.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateMarketPlanUseCase({
          businessRepo,
          amqpConnection: this.amqpConnection,
        });

        return await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'Market plan analysis generated successfully',
      score: data.score,
      feedback: data.feedback,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKETING)
  async saveMarketPlan(@Args('input') input: SaveMarketPlanInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = SaveMarketPlan.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SaveMarketPlanUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'Market plan saved successfully',
      business: result,
    };
  }
}
