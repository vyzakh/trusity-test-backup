import { GenerateMarketFitFeedbackUseCase } from '@application/use-cases/business/generate-market-fit-feedback.use-case';
import { SaveMarketFitUseCase } from '@application/use-cases/business/save-market-fit.use-case';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { SaveMarketFitInput } from './dto/create-market-fit.dto';
import { GenerateMarketFitFeedbackInput } from './dto/get-market-fit.dto';
import { SaveMarketFitSchema } from './schemas/create-market-fit.schema';
import { GenerateMarketFitFeedbackSchema } from './schemas/get-market-fit.schema';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class marketFitResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKET_FIT)
  async generateMarketFitFeedback(@Args('input') input: GenerateMarketFitFeedbackInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateMarketFitFeedbackSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateMarketFitFeedbackUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'success',
      business: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKET_FIT)
  async saveMarketFit(@Args('input') input: SaveMarketFitInput) {
    const validation = SaveMarketFitSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SaveMarketFitUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'success',
      business: data,
    };
  }
}
