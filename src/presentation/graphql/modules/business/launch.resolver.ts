import { GenerateLaunchRecommendationUseCase } from '@application/use-cases/business/generate-launch-recommendation.use-case';
import { SaveLaunchUseCase } from '@application/use-cases/business/save-launch.use-case';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { SaveLaunchSchema } from './schemas/launch.schema';
import { Business } from './types';
import { GenerateLaunchRecommendationsArgs, SaveLaunchInput } from './types/launch.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver(() => Business)
export class LaunchResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
    private readonly ws: WSGateway,
  ) {}

  @Query(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.LAUNCH)
  async generateLaunchRecommendation(@Args() args: GenerateLaunchRecommendationsArgs, @CurrentUser() user: ICurrentStudentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateLaunchRecommendationUseCase({ businessRepo, amqpConnection: this.amqpConnection });
        const data = await useCase.execute({ data: args, user });
        return data;
      },
    });

    return {
      message: 'Business launch recommendation generated successfully',
      business: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async saveLaunch(@Args('input') input: SaveLaunchInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = SaveLaunchSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SaveLaunchUseCase({
          businessRepo,
          dbService: this.dbService,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully created save launch',
      business: data,
    };
  }
}
