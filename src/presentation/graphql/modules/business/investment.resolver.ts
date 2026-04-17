import { CreateInvestmentUseCase } from '@application/use-cases/business/create-investment.use-case';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { CreateInvestmentInput } from './dto/create-investment.dto';
import { CreateInvestmentSchema } from './schemas/create-investment.schema';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class InvestmentResolver {
  constructor(private readonly dbService: DatabaseService) {}
  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.INVESTMENT)
  async createInvestment(@Args('input') args: CreateInvestmentInput) {
    const validation = CreateInvestmentSchema.safeParse(args);

    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateInvestmentUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });
    return {
      message: 'Successfully created investment',
      business: data,
    };
  }
}
