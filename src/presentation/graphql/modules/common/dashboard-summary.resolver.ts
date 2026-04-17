import { GetBusinessAverageScoresUseCase } from '@application/use-cases/business/get-business-average-scores.use-case';
import { ICurrentUser } from '@core/types';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate } from '@shared/decorators';
import { BusinessAverageScores } from '../business/types';
import { DashboardFilterArgs } from './types/dashboard-filter.type';

@Resolver()
export class DashboardSummaryResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Query(() => BusinessAverageScores)
  @IsPrivate()
  async averageBusinessScores(@CurrentUser() user: ICurrentUser, @Args() args: DashboardFilterArgs) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessAverageScoresUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: user.schoolId,
            ...args,
          },
        });
      },
    });
  }
}
