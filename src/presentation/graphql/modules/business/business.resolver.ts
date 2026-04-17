import { AiPerformanceFeedbackService } from '@application/services';
import { CreateBusinessUseCase, GetGradeUseCase, GetStudentUseCase } from '@application/use-cases';
import { DeleteBusinessUseCase } from '@application/use-cases/business/delete-business.use-case';
import { DownloadMarketResearchQuestionnaireUseCase } from '@application/use-cases/business/download-market-research-questionnaire.use-case';
import { ExportBusinessModelUseCase } from '@application/use-cases/business/export-business-model.use-case';
import { ExportBusinessSummaryUseCase } from '@application/use-cases/business/export-business-summary.use-case';
import { GenerateMarketResearchDataUseCase } from '@application/use-cases/business/generate-market-research-data.use-case';
import { GenerateMarketResearchQuestionsUseCase } from '@application/use-cases/business/generate-market-research-questions.use-case';
import { SaveMarketResearchUseCase } from '@application/use-cases/business/generate-market-research-score.use-case';
import { GenerateProblemStatementFeedbackUseCase } from '@application/use-cases/business/generate-problem-statement-feedback.use-case';
import { GetBusinessAchievedBadgeUseCase } from '@application/use-cases/business/get-business-achieved-badge.use-case';
import { GetBusinessAverageScoresUseCase } from '@application/use-cases/business/get-business-average-scores.use-case';
import { GetBusinessChallengeUseCase } from '@application/use-cases/business/get-business-challenge.use-case';
import { GetBusinessCompletedStatusUseCase } from '@application/use-cases/business/get-business-completed-status.use-case';
import { GetBusinessAiPerformanceFeedbackUseCase } from '@application/use-cases/business/get-business-feedback.use-case';
import { GetBusinessIdeasUseCase } from '@application/use-cases/business/get-business-ideas.use-case';
import { GetBusinessNextStepUseCase } from '@application/use-cases/business/get-business-next-step.use-case';
import { GetBusinessPerformanceReportUseCase } from '@application/use-cases/business/get-business-performance-report.use-case';
import { GetBusinessPhaseBadgesUseCase } from '@application/use-cases/business/get-business-phase-badges.use-case';
import { GetBusinessPhaseStatusesUseCase } from '@application/use-cases/business/get-business-phase-statuses.use-case';
import { GetBusinessProgressPercentageUseCase } from '@application/use-cases/business/get-business-progress-percentage.use-case';
import { GetBusinessProgressScoreUseCase } from '@application/use-cases/business/get-business-progress-score.use-case';
import { GetBusinessProgressStatusUseCase } from '@application/use-cases/business/get-business-progress-status.use-case';
import { GetBusinessSdgsUseCase } from '@application/use-cases/business/get-business-sdgs.use-case';
import { GetBusinessStatusUseCase } from '@application/use-cases/business/get-business-status.use-case';
import { GetBusinessStepsUseCase } from '@application/use-cases/business/get-business-steps.use-case';
import { GetBusinessUseCase } from '@application/use-cases/business/get-business.use-case';
import { GetBusinessesAverageScoresUseCase } from '@application/use-cases/business/get-businesses-average-scores.use-case';
import { GetBusinessesUseCase } from '@application/use-cases/business/get-businesses.use-case';
import { GetUniqueBusinessCountUseCase } from '@application/use-cases/business/get-unique-business-count.use-case';
import { TotalBusinessesUseCase } from '@application/use-cases/business/total-businesses-use-case';
import { UpdateBusinessUseCase } from '@application/use-cases/business/update-business.use-case';
import { GetPrototypeOptionsUseCase } from '@application/use-cases/common/get-prototype-options.use-case';
import { GetBusinessPhaseLockStatusUseCase } from '@application/use-cases/school/get-business-phase-lock-status.use-case';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import {
  BadgeRepository,
  BusinessPhaseLockRepository,
  BusinessRepository,
  ChallengeRepository,
  DatabaseService,
  EnrollmentRepository,
  LookupRepository,
  SchoolRepository,
  StudentRepository,
} from '@infrastructure/database';
import { AiPerformanceFeedbackRepository } from '@infrastructure/database/repositories/ai-performance-feedback.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { CheckBusinessPhaseLock } from '@shared/decorators/check-business-phse-lock.decorator';
import { BusinessStatus, UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { BusinessPhaseEnum } from '@shared/enums/business-phase.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentStudentUser, ICurrentUser } from 'src/core/types';
import { AchievedBadge } from '../badge/types/badge.type';
import { Challenge } from '../challenge/types';
import { Grade, Sdg } from '../common/types';
import { Student } from '../student/types';
import { CreateBusinessInput } from './dto';
import {
  GenerateMarketResearchDataInput,
  GenerateMarketResearchQuestionsInput,
  GenerateMarketResearchScoreInput,
  GenerateProblemStatementFeedbackInput,
} from './dto/get-problem-statement.dto';
import { CreateBusinessSchema } from './schemas';
import { ExportBusinessSummarySchema } from './schemas/business-summary.schema';
import { BusinessesSchema, BusinessIdeasSchema, UpdateBusinessSchema } from './schemas/business.schema';
import { DeleteBusinessSchema } from './schemas/delete-business.schema';
import {
  GenerateMarketResearchDataSchema,
  GenerateMarketResearchQuestionsSchema,
  GenerateMarketResearchScoreSchema,
  GenerateProblemStatementFeedbackSchema,
} from './schemas/get-problem-statement-feedback.schema';
import {
  AverageBusinessesScoresArgs,
  Business,
  BusinessAverageScores,
  BusinessesArgs,
  BusinessIdea,
  BusinessIdeasInput,
  BusinessNextStep,
  BusinessPhaseStatuses,
  BusinessProgressScore,
  BusinessProgressStatus,
  BusinessSteps,
  CreateBusinessResult,
  DeleteBusinessArgs,
  DeleteBusinessResult,
  ExportBusinessModelResult,
  ExportBusinessSummaryInput,
  ExportBusinessSummaryResult,
  UpdateBusinessInput,
} from './types';
import { BusinessFeedback } from './types/business-feedback.type';
import { BusinessPhaseLockStatus } from './types/business-lock.types';
import { ExportBusinessModelInput } from './types/business-model.type';
import { BusinessPerformanceReportArgs } from './types/business-performance-report.args';
import { BusinessPerformanceReport } from './types/business-performance-report.type';
import { BusinessPhaseBadge } from './types/phase-badge.type';
import { BusinessResult, GenerateMarketResearchScoreResult } from './types/problem-statement.type';
import { PrototypeOption } from './types/prototype-result.type';
import { GetStartupTerminologiesUseCase } from '@application/use-cases/business/get-startup-terminologies.use-case';
import { StartupTerminologies } from './types/startup-terminologies.type';
import { GetBusinessGradeUseCase } from '@application/use-cases/business/get-business-grade.use-case';

@Resolver(() => Business)
export class BusinessResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
  ) {}

  @Mutation(() => CreateBusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async createBusiness(@Args('input') input: CreateBusinessInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = CreateBusinessSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
        businessRepo: new BusinessRepository(db),
        challengeRepo: new ChallengeRepository(db),
        businessPhaseLockRepo: new BusinessPhaseLockRepository(db),
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ businessRepo, challengeRepo, lookupRepo, businessPhaseLockRepo, schoolRepo }) => {
        const useCase = new CreateBusinessUseCase({
          logger: new Logger(CreateBusinessUseCase.name),
          dbService: this.dbService,
          businessRepo,
          challengeRepo,
          lookupRepo,
          businessPhaseLockRepo,
          schoolRepo,
          emailService: this.emailService,
          ws: this.ws,
        });
        const data = await useCase.execute({ data: validation.data, user });
        return data;
      },
    });

    return {
      message: 'Business created successfully',
      business: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async updateBusiness(@Args('input') input: UpdateBusinessInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = UpdateBusinessSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ businessRepo, lookupRepo }) => {
        const useCase = new UpdateBusinessUseCase({
          logger: new Logger(UpdateBusinessUseCase.name),
          dbService: this.dbService,
          businessRepo,
          lookupRepo,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Business updated successfully.',
      business: data,
    };
  }

  @Query(() => [BusinessIdea])
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async businessIdeas(@Args('input') input: BusinessIdeasInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = BusinessIdeasSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetBusinessIdeasUseCase({ amqpConnection: this.amqpConnection, lookupRepo });

        return await useCase.execute({ data: validation.data, user });
      },
    });

    return data;
  }

  @Query(() => [Business])
  @IsPrivate()
  async businesses(@Args() args: BusinessesArgs, @CurrentUser() user: ICurrentUser) {
    const validation = BusinessesSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessesUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @ResolveField(() => BusinessStatus, { nullable: false })
  async status(@Parent() business: Business): Promise<BusinessStatus> {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessStatusUseCase({
          businessRepo,
        });

        return useCase.execute({
          data: { businessId: business.id },
        });
      },
    });
  }

  @Query(() => Int)
  @IsPrivate()
  async totalBusinesses(@Args() args: BusinessesArgs, @CurrentUser() user: ICurrentUser) {
    const validation = BusinessesSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new TotalBusinessesUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => Int)
  @IsPrivate()
  async totalUniqueIdeas(@CurrentUser() user: ICurrentUser, @Args() args: BusinessesArgs) {
    const validation = BusinessesSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetUniqueBusinessCountUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => Business, { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.STUDENT, UserScope.TEACHER, UserScope.SCHOOL_ADMIN)
  async business(@Args('businessId') businessId: string, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessUseCase({ businessRepo });

        return await useCase.execute({
          data: { businessId },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Sdg], { nullable: true })
  async sdgs(@Parent() business: Business) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ businessRepo, challengeRepo }) => {
        const useCase = new GetBusinessSdgsUseCase({ businessRepo, challengeRepo });

        const data = await useCase.execute({
          data: { businessId: business.id, challengeId: business.challengeId, source: business.source },
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => Challenge, { nullable: true })
  async challenge(@Parent() business: Business) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetBusinessChallengeUseCase({ challengeRepo });

        const data = await useCase.execute({
          data: { challengeId: business.challengeId },
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => [BusinessPhaseLockStatus])
  async businessPhaseLockStatus(@Parent() business: Business, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessPhaseLockRepo: new BusinessPhaseLockRepository(db),
      }),
      callback: async ({ businessPhaseLockRepo }) => {
        const useCase = new GetBusinessPhaseLockStatusUseCase({
          businessPhaseLockRepo,
        });

        return await useCase.execute({
          data: {
            studentId: business.studentId,
            academicYearId: business.academicYearId,
            businessId: business.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [StartupTerminologies])
  async startupTerminologies(@Parent() business: Business, @Args('category', { type: () => String, nullable: true }) category: string) {
    const result = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetStartupTerminologiesUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            category,
          },
        });
      },
    });
    return result;
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PROBLEM_STATEMENT)
  @CheckBusinessPhaseLock(BusinessPhaseEnum.INNOVATION)
  async generateProblemStatementFeedback(@Args('input') input: GenerateProblemStatementFeedbackInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateProblemStatementFeedbackSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateProblemStatementFeedbackUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully recieved problem statement feedback and tips',
      business: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKET_RESEARCH)
  async generateMarketResearchData(@Args('input') input: GenerateMarketResearchDataInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateMarketResearchDataSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateMarketResearchDataUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'success',
      business: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKET_RESEARCH)
  async generateMarketResearchQuestions(@Args('input') input: GenerateMarketResearchQuestionsInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateMarketResearchQuestionsSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateMarketResearchQuestionsUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'success',
      business: data,
    };
  }

  @Query(() => BusinessAverageScores)
  @IsPrivate()
  async averageBusinessesScores(@CurrentUser() user: ICurrentUser, @Args() args: AverageBusinessesScoresArgs) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessesAverageScoresUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: args,
          user,
        });
      },
    });
  }

  @Mutation(() => GenerateMarketResearchScoreResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.MARKET_RESEARCH)
  async saveMarketResearch(@Args('input') input: GenerateMarketResearchScoreInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateMarketResearchScoreSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SaveMarketResearchUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'success',
      business: data,
    };
  }

  @ResolveField(() => BusinessProgressScore, { nullable: true })
  async progressScore(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessProgressScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
        });
      },
    });
  }

  @ResolveField(() => BusinessProgressStatus, { nullable: true })
  async progressStatus(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessProgressStatusUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: { businessId: business.id },
        });
      },
    });
  }

  @ResolveField(() => BusinessPhaseStatuses)
  async phaseStatuses(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessPhaseStatusesUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: { businessId: business.id },
        });
      },
    });
  }

  @ResolveField(() => [PrototypeOption])
  async availablePrototypeOptions() {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetPrototypeOptionsUseCase({
          lookupRepo,
        });

        return await useCase.execute();
      },
    });
  }

  @ResolveField(() => BusinessNextStep, { nullable: true })
  async nextStep(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        enrollmentRepo: new EnrollmentRepository(db),
      }),
      callback: async ({ businessRepo, enrollmentRepo }) => {
        const useCase = new GetBusinessNextStepUseCase({
          businessRepo,
          enrollmentRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async progressPercentage(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        enrollmentRepo: new EnrollmentRepository(db),
      }),
      callback: async ({ businessRepo, enrollmentRepo }) => {
        const useCase = new GetBusinessProgressPercentageUseCase({
          businessRepo,
          enrollmentRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
        });
      },
    });
  }

  @ResolveField(() => BusinessAverageScores, { nullable: true })
  async averageScores(@Parent() business: Business) {
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
            businessId: business.id,
          },
        });
      },
    });
  }

  @ResolveField(() => Boolean, { nullable: false })
  async isCompleted(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessCompletedStatusUseCase({ businessRepo });
        return await useCase.execute({ data: { businessId: business.id } });
      },
    });
  }

  @ResolveField(() => String, { nullable: true })
  async marketResearchQuestionnaireDownload(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new DownloadMarketResearchQuestionnaireUseCase({
          businessRepo,
        });

        return await useCase.execute({
          downloadMarketResearchQuestionnaire: {
            businessId: business.id,
          },
        });
      },
    });
  }

  @Mutation(() => DeleteBusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async deleteBusiness(@Args() args: DeleteBusinessArgs, @CurrentUser() user: ICurrentStudentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = DeleteBusinessSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new DeleteBusinessUseCase({
          logger: new Logger(DeleteBusinessUseCase.name),
          dbService: this.dbService,
          businessRepo,
          ws: this.ws,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return { message: 'The business record has been successfully removed.' };
  }

  @Mutation(() => ExportBusinessModelResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.BUSINESS_MODEL)
  async exportBusinessModel(@Args() input: ExportBusinessModelInput, user: ICurrentStudentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new ExportBusinessModelUseCase({
          businessRepo,
          s3Service: this.s3Service,
        });

        return await useCase.execute({
          data: input,
          user: user,
        });
      },
    });

    return {
      message: 'Successfully exported business model pdf',
      file: data,
    };
  }

  @ResolveField(() => [BusinessSteps])
  async steps() {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessStepsUseCase({ businessRepo });
        return await useCase.execute({});
      },
    });
  }

  @Mutation(() => ExportBusinessSummaryResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async exportBusinessSummary(@Args('input') input: ExportBusinessSummaryInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = ExportBusinessSummarySchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const fileUrl = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ businessRepo, studentRepo }) => {
        const useCase = new ExportBusinessSummaryUseCase({
          businessRepo,
          studentRepo,
          s3Service: this.s3Service,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully exported business summary PDF',
      file: fileUrl,
    };
  }

  @ResolveField(() => AchievedBadge, { nullable: true })
  async achievedBadge(@Parent() business: Business, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        badgeRepo: new BadgeRepository(db),
      }),
      callback: async ({ businessRepo, badgeRepo }) => {
        const useCase = new GetBusinessAchievedBadgeUseCase({
          businessRepo,
          badgeRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [BusinessPhaseBadge])
  async phaseBadgesAchieved(@Parent() business: Business, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        badgeRepo: new BadgeRepository(db),
      }),
      callback: async ({ businessRepo, badgeRepo }) => {
        const useCase = new GetBusinessPhaseBadgesUseCase({
          businessRepo,
          badgeRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
          user,
        });
      },
    });
  }

  @Query(() => BusinessPerformanceReport, { nullable: true })
  @IsPrivate()
  async businessPerformanceReport(@CurrentUser() user: ICurrentUser, @Args() args: BusinessPerformanceReportArgs) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetBusinessPerformanceReportUseCase({
          businessRepo,
        });
        return await useCase.execute({
          data: {
            businessId: args.businessId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Student, { nullable: true })
  async student(@Parent() business: Business, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentUseCase({
          studentRepo,
        });
        return await useCase.execute({
          data: {
            studentId: business.studentId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Grade, { nullable: true })
  async grade(@Parent() business: Business) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        enrollmentRepo: new EnrollmentRepository(db),
      }),
      callback: async ({ enrollmentRepo }) => {
        const useCase = new GetBusinessGradeUseCase({
          enrollmentRepo,
        });
        return await useCase.execute({
          data: {
            studentId: business.studentId,
            academicYearId: business.academicYearId,
          },
        });
      },
    });
  }

  @ResolveField(() => BusinessFeedback, { nullable: true })
  async feedback(@Parent() business: Business, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ aiPerformanceFeedbackRepo }) => {
        const useCase = new GetBusinessAiPerformanceFeedbackUseCase({
          aiPerformanceFeedbackService: new AiPerformanceFeedbackService({
            amqpConnection: this.amqpConnection,
          }),
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: {
            businessId: business.id,
          },
          user,
        });
      },
    });
  }
}
