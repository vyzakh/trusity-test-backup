import { GeneratePrototypeSuggestionsUseCase } from '@application/use-cases/business/generate-prototype-suggestions-use-case';
import { SavePrototypetUseCase } from '@application/use-cases/business/save-prototype.use-case';
import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService, LookupRepository } from '@infrastructure/database';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { minutes, Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '@presentation/graphql/gaurds/gql-throttle.guard';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { NodeEnv, UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { GeneratePrototypeSuggestionsInput, SavePrototypeInput } from './dto/create-prototype.dto';
import { GeneratePrototypeSuggestionsSchema, SavePrototypeSchema } from './schemas/create-prototype.schema';
import { BusinessResult } from './types/problem-statement.type';
import { GeneratePrototypeSuggestionsResult } from './types/prototype-result.type';

@Resolver()
export class prototypeResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => GeneratePrototypeSuggestionsResult)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: process.env.NODE_ENV !== NodeEnv.Production ? Infinity : 3, ttl: minutes(5), blockDuration: minutes(5) } })
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PROTOTYPE)
  async generatePrototypeSuggestions(@Args('input') input: GeneratePrototypeSuggestionsInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GeneratePrototypeSuggestionsSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ lookupRepo, businessRepo }) => {
        const useCase = new GeneratePrototypeSuggestionsUseCase({
          amqpConnection: this.amqpConnection,
          lookupRepo,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PROTOTYPE)
  async savePrototype(@Args('input') input: SavePrototypeInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = SavePrototypeSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SavePrototypetUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully saved prototype',
      business: data,
    };
  }
}
