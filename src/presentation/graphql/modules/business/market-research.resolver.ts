import { ExportMarketResearchQuestionnaireUseCase } from '@application/use-cases/business/export-market-research-questionnaire.use-case';
import { DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser } from 'src/core/types';
import { ExportMarketResearchQuestionnaireSchema } from './schemas/export-market-research-questionnaire.schema';
import { ExportMarketResearchQuestionnaireInput, ExportMarketResearchQuestionnaireResult } from './types/market-research.type';

@Resolver()
export class marketResearchResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Mutation(() => ExportMarketResearchQuestionnaireResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async exportMarketResearchQuestionnaire(@Args('input') input: ExportMarketResearchQuestionnaireInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = ExportMarketResearchQuestionnaireSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async () => {},
      callback: async () => {
        const useCase = new ExportMarketResearchQuestionnaireUseCase();

        return await useCase.execute({
          data: validation.data,
        });
      },
    });
  }
}
