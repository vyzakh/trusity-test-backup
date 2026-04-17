import { UpdateBusinessLearningContentOrdersUseCase } from '@application/use-cases';
import { CreateBusinessLearningContentUseCase } from '@application/use-cases/business-learning/create-business-learning-content.use-case';
import { DeleteBusinessLearningContentUseCase } from '@application/use-cases/business-learning/delete-business-learning-content.use-case';
import { GetBusinessLearningContentsUseCase } from '@application/use-cases/business-learning/get-business-learning-contents.use-case';
import { GetBusinessLearningPhasesUseCase } from '@application/use-cases/business-learning/get-business-learning-phases.use-case';
import { GetBusinessLearningStepsUseCase } from '@application/use-cases/business-learning/get-business-learning-steps.use-case';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessLearningRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { IsPrivate, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { CreateBusinessLearningContentSchema, DeleteBusinessLearningContentSchema, UpdateBusinessLearningContentOrdersSchema } from './schemas/business-learning.schema';
import {
  BusinessLearningContent,
  BusinessLearningContentsArgs,
  BusinessLearningPhase,
  BusinessLearningStep,
  CreateBusinessLearningContentInput,
  CreateBusinessLearningContentResult,
  DeleteBusinessLearningContentArgs,
  DeleteBusinessLearningContentResult,
  UpdateBusinessLearningContentOrdersInput,
} from './types/business-learning.type';

@Resolver()
export class BusinessLearningResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly s3Servie: S3Service,
  ) {}

  @Query(() => [BusinessLearningPhase])
  @IsPrivate()
  async businessLearningPhases() {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new GetBusinessLearningPhasesUseCase({ businessLearningRepo });

        return await useCase.execute({
          data: {},
        });
      },
    });
  }

  @Mutation(() => CreateBusinessLearningContentResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async createBusinessLearningContent(@Args('input') input: CreateBusinessLearningContentInput) {
    const validation = CreateBusinessLearningContentSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new CreateBusinessLearningContentUseCase({ s3Service: this.s3Servie, businessLearningRepo });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Learning content uploaded successfully',
      businessLearningContent: data,
    };
  }

  @Query(() => [BusinessLearningContent])
  @IsPrivate()
  async businessLearningContents(@Args() args: BusinessLearningContentsArgs) {
    return await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new GetBusinessLearningContentsUseCase({
          businessLearningRepo,
        });

        return await useCase.execute({
          data: args,
        });
      },
    });
  }

  @Mutation(() => DeleteBusinessLearningContentResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async deleteBusinessLearningContent(@Args() args: DeleteBusinessLearningContentArgs) {
    const validation = DeleteBusinessLearningContentSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new DeleteBusinessLearningContentUseCase({ businessLearningRepo });

        await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Learning content deleted successfully',
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async updatedBusinessLearningContentOrders(@Args('input', { type: () => [UpdateBusinessLearningContentOrdersInput] }) input: UpdateBusinessLearningContentOrdersInput[]) {
    const validation = UpdateBusinessLearningContentOrdersSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new UpdateBusinessLearningContentOrdersUseCase({ businessLearningRepo });

        await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'success',
    };
  }
}

@Resolver(() => BusinessLearningPhase)
export class BusinessLearningPhaseResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [BusinessLearningStep])
  async businessLearningSteps(@Parent() businessLearningPhase: BusinessLearningPhase, @Args('gradeId') gradeId: number) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new GetBusinessLearningStepsUseCase({ businessLearningRepo });

        return await useCase.execute({
          data: {
            gradeId,
            businessLearningPhaseId: businessLearningPhase.id,
          },
        });
      },
    });
  }
}

@Resolver(() => BusinessLearningStep)
export class BusinessLearningStepResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [BusinessLearningContent])
  async businessLearningContents(@Parent() businessLearningStep: BusinessLearningStep) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessLearningRepo: new BusinessLearningRepository(db),
      }),
      callback: async ({ businessLearningRepo }) => {
        const useCase = new GetBusinessLearningContentsUseCase({ businessLearningRepo });

        return await useCase.execute({
          data: {
            gradeId: businessLearningStep.gradeId,
            stepId: businessLearningStep.id,
          },
        });
      },
    });
  }
}
