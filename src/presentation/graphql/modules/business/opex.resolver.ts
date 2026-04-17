import { CreateOpexUseCase } from '@application/use-cases/business/create-opex.use-case';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { CreateOpexSchema } from './schemas/opex.schema';
import { CreateOpexInput } from './types/opex.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class OpexResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.OPEX)
  async createOpex(@Args('input') input: CreateOpexInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateOpexSchema.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateOpexUseCase({
          businessRepo,
        });

        await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'Opex created successfully',
      business: result,
    };
  }
}
