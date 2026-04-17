import { CreateFinancialPlanningUseCase } from '@application/use-cases/business/create-financial-planning.use-case';
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
import { CreateFinancialPlanning } from './schemas/financial-planning.schema';
import { CreateFinancialPlanningInput } from './types/financial-planning.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class FinancialPlanningResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.FINANCIAL_PROJECTIONS)
  async createFinancialPlanning(@Args('input') input: CreateFinancialPlanningInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateFinancialPlanning.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateFinancialPlanningUseCase({
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
      message: 'Financial planning created successfully',
      business: result,
    };
  }
}
