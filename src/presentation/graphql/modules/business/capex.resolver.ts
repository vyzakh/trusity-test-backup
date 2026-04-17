import { CreateCapexUseCase } from '@application/use-cases/business/create-capex.usecase';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { CreateCapexSchema } from './schemas/capex.schema';
import { CreateCapexInput } from './types/capex.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class CapexResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.CAPEX)
  async createCapex(@Args('input') input: CreateCapexInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateCapexSchema.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateCapexUseCase({
          businessRepo,
        });

        await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'Capex created successfully',
      business: result,
    };
  }
}
