import { CreateRevenueModelUseCase } from '@application/use-cases/business/create-revenue-model.usecase';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { CreateRevenueModelSchema } from './schemas/create-revenue-model.schema';
import { BusinessResult } from './types/problem-statement.type';
import { CreateRevenueModelInput } from './types/revenue-model.type';

@Resolver()
export class RevenueModelResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.REVENUE_MODEL)
  async createRevenueModel(@Args('input') input: CreateRevenueModelInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateRevenueModelSchema.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateRevenueModelUseCase({
          businessRepo,
        });

        await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'Revenue model created successfully',
      business: result,
    };
  }
}
