import { BusinessPhaseLockRepository, DatabaseService, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BusinessPhaseLockStatus, BusinessPhaseLockStatusArgs, ToggleBusinessPhaseLockInput } from './types/business-lock.types';
import { CurrentUser, IsPrivate, RequirePermissions, Scopes } from '@shared/decorators';
import { ICurrentUser } from '@core/types';
import { GetBusinessPhaseLockStatusUseCase } from '@application/use-cases/school/get-business-phase-lock-status.use-case';
import { ToggleBusinessPhaseLockUseCase } from '@application/use-cases/business-learning/toggle-business-phase-lock.use-case';
import { BaseResult } from '@presentation/graphql/shared/types';
import { Logger } from '@nestjs/common';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { UserScope } from '@shared/enums';

@Resolver()
export class BusinessLockResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
  ) {}

  @Query(() => [BusinessPhaseLockStatus!])
  @IsPrivate()
  async businessPhaseLockStatus(@Args() args: BusinessPhaseLockStatusArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessPhaseLockRepo: new BusinessPhaseLockRepository(db),
      }),
      callback: async ({ businessPhaseLockRepo }) => {
        const useCase = new GetBusinessPhaseLockStatusUseCase({
          businessPhaseLockRepo,
        });

        return await useCase.execute({
          data: args,
          user,
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  @RequirePermissions('phase:toggle_lock')
  async toggleBusinessPhaseLock(@Args('input') input: ToggleBusinessPhaseLockInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessPhaseLockRepo: new BusinessPhaseLockRepository(db),
        studentRepo: new StudentRepository(db),
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ businessPhaseLockRepo, studentRepo, schoolRepo }) => {
        const useCase = new ToggleBusinessPhaseLockUseCase({
          logger: new Logger(ToggleBusinessPhaseLockUseCase.name),
          dbService: this.dbService,
          ws: this.ws,
          emailService: this.emailService,
          businessPhaseLockRepo,
          studentRepo,
          schoolRepo,
        });
        await useCase.execute({
          data: input,
          user,
        });
      },
    });
    return {
      message: 'Business phase locked / unlocked successfully',
    };
  }
}
