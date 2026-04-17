import { GetBadgesUseCase } from '@application/use-cases/badge/get-badges.usecase';
import { UpdateBadgeUseCase } from '@application/use-cases/badge/update-badge.usecase';
import { ICurrentUser } from '@core/types';
import { BadgeRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, RequirePermissions, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { UpdateBadgeInput } from '../inputs/update-badge.input';
import { Badge } from '../types/badge.type';

@Resolver()
export class BadgeResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @Query(() => [Badge])
  @IsPrivate()
  async badges() {
    return this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        badgeRepository: new BadgeRepository(db),
      }),
      callback: async ({ badgeRepository }) => {
        const useCase = new GetBadgesUseCase({ badgeRepository });
        return useCase.execute();
      },
    });
  }

  @Mutation(() => BaseResult)
  @Scopes(UserScope.PLATFORM_USER)
  @RequirePermissions('badge:update')
  async updateBadges(@Args('input', { type: () => [UpdateBadgeInput] }) input: UpdateBadgeInput[], @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        badgeRepository: new BadgeRepository(db),
      }),
      callback: async ({ badgeRepository }) => {
        const useCase = new UpdateBadgeUseCase({
          badgeRepository,
        });

        await useCase.execute({
          data: {
            badges: input,
          },
          user,
        });
      },
    });

    return {
      message: 'Successfully updated badges',
    };
  }
}
