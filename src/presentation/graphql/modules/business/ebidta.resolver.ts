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
import { BusinessResult } from './types/problem-statement.type';
import { CreateEbidtaUseCase } from '@application/use-cases/business/create-ebidta.usecase';
import { CreateEbidtaInput } from './types/ebidta.type';
import { CreateEbidtaSchema } from './schemas/ebidta.schema';

@Resolver()
export class EbidtaResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.EBITDA)
  async createEbidta(@Args('input') input: CreateEbidtaInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateEbidtaSchema.safeParse(input);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const result = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateEbidtaUseCase({
          businessRepo,
        });

        await useCase.execute({
          data: validation.data,
          user: user,
        });
      },
    });

    return {
      message: 'EBITDA created successfully',
      business: result,
    };
  }
}
