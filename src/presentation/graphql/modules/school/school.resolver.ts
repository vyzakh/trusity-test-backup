import { AiPerformanceFeedbackService } from '@application/services/ai-performance-feedback.service';
import { SchoolPromoteService } from '@application/services/school-promote.service';
import {
  AcademicYearsUseCase,
  CreateSchoolGradeUseCase,
  CreateSchoolUseCase,
  DeleteSchoolGradeUseCase,
  GetGradePerformanceProgressionUseCase,
  GetSchoolCarriculumsUseCase,
  GetSchoolGradesUseCase,
  GetSchoolPerformanceProgressionUseCase,
  GetSchoolStatsUseCase,
  GetSchoolsUseCase,
  GetSchoolUseCase,
  TotalSchoolsUseCase,
  TotalStudentsUseCase,
  TotalTeachersUseCase,
  UpdateSchoolGradeUseCase,
  UpdateSchoolUseCase,
} from '@application/use-cases';
import { GetTopPerformedBusinessesUseCase } from '@application/use-cases/business/get-top-performed-businesses.use-case';
import { GetUniqueBusinessCountUseCase } from '@application/use-cases/business/get-unique-business-count.use-case';
import { GetSchoolPerformanceAiFeedbackUseCase } from '@application/use-cases/feedback';
import { ToggleSchoolActivationUseCase } from '@application/use-cases/school/activate-school.use-case';
import { DeleteSchoolSectionUseCase } from '@application/use-cases/school/delete-school-section.use-case';
import { GetAcademicYearUseCase } from '@application/use-cases/school/get-academic-year.use-case';
import { GetEnrollmentStatusUseCase } from '@application/use-cases/school/get-enrollment-status.use-case';
import { GetOverallGradeScoreUseCase } from '@application/use-cases/school/get-overall-grade-score.use-case';
import { GetOverallSchoolPhaseScoresUseCase } from '@application/use-cases/school/get-overall-school-phase-scores.use-case';
import { GetOverallSchoolScoreUseCase } from '@application/use-cases/school/get-overall-school-score.use-case';
import { GetAverageBusinessScoresUseCase } from '@application/use-cases/school/get-school-avarage-business-scores.use-case';
import { GetSchoolCurrentBadgeUseCase } from '@application/use-cases/school/get-school-current-badge.use-case';
import { PromoteSchoolUseCase } from '@application/use-cases/school/promote-school.use-case';
import { TotalGradesUseCase } from '@application/use-cases/school/total-grades.use-case';
import { TotalSectionsUseCase } from '@application/use-cases/school/total-sections.use-case';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  AiPerformanceFeedbackRepository,
  BadgeRepository,
  BusinessRepository,
  DatabaseService,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, RequirePermissions, Scopes } from '@shared/decorators';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentUser } from 'src/core/types';
import { AchievedBadge } from '../badge/types/badge.type';
import { Business } from '../business/types';
import { EnrollmentStatus } from '../common/types';
import { AcademicYear } from '../common/types/academic-year.type';
import {
  AcademicYearsArgs,
  CreateSchoolGradeInput,
  CreateSchoolInput,
  DeleteSchoolGradeInput,
  DeleteSchoolSectionInput,
  SchoolArgs,
  SchoolsArgs,
  ToggleSchoolActivationArgs,
  UpdateSchoolGradeInput,
  UpdateSchoolInput,
} from './dto';
import { OverallSchoolPhaseScoresInput } from './dto/overall-school-phase-scores.args';
import { TopPerformedBusinessesArgs } from './dto/top-performed-businesses.args';
import {
  AcademicYearsSchema,
  CreateSchoolGradeSchema,
  CreateSchoolSchema,
  DeleteSchoolGradeSchema,
  SchoolSchema,
  SchoolsSchema,
  ToggleSchoolActivationSchema,
  UpdateSchoolSchema,
} from './schemas';
import {
  AIGeneratedFeedback,
  BusinessPhaseAverageScore,
  CreateSchoolResult,
  GradeLevel2ReportArgs,
  PerformanceProgression,
  PromoteSchoolInput,
  School,
  SchoolCarriculum,
  SchoolGrade,
  SchoolStats,
  ToggleSchoolActivationResult,
  UpdateSchoolResult,
} from './types';
import { OverallSchoolPhaseScores } from './types/school-phase-scores.type';

@Resolver(() => School)
export class SchoolResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => CreateSchoolResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  @RequirePermissions('school:create')
  async createSchool(@Args('input') input: CreateSchoolInput, @CurrentUser() user: ICurrentUser) {
    const validation = CreateSchoolSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo, schoolRepo }) => {
        const useCase = new CreateSchoolUseCase({
          logger: new Logger(CreateSchoolUseCase.name),
          dbService: this.dbService,
          lookupRepo,
          schoolRepo,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully created school',
      school: data,
    };
  }

  @Mutation(() => UpdateSchoolResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  @RequirePermissions('school:update')
  async updateSchool(@Args('input') input: UpdateSchoolInput, @CurrentUser() user: ICurrentUser) {
    const validation = UpdateSchoolSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
      }),
      callback: async ({ schoolRepo, platformUserRepo, notificationRepo }) => {
        const useCase = new UpdateSchoolUseCase({
          logger: new Logger(UpdateSchoolUseCase.name),
          dbService: this.dbService,
          schoolRepo,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated school',
      school: data,
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async createSchoolGrade(@Args('input') input: CreateSchoolGradeInput, @CurrentUser() user: ICurrentUser) {
    const validation = CreateSchoolGradeSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        emailService: this.emailService,
        ws: this.ws,
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo }) => {
        const useCase = new CreateSchoolGradeUseCase({
          schoolRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          ws: this.ws,
          schoolAdminRepo,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Grade added successfully.',
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async deleteSchoolGrade(@Args('input') input: DeleteSchoolGradeInput, @CurrentUser() user: ICurrentUser) {
    const validation = DeleteSchoolGradeSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo }) => {
        const useCase = new DeleteSchoolGradeUseCase({
          schoolRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          ws: this.ws,
          schoolAdminRepo,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Grade deleted successfully.',
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async deleteSchoolSection(@Args('input') input: DeleteSchoolSectionInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new DeleteSchoolSectionUseCase({
          schoolRepo,
        });

        await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Section deleted successfully.',
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async updateSchoolGrade(@Args('input') input: UpdateSchoolGradeInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo }) => {
        const useCase = new UpdateSchoolGradeUseCase({
          schoolRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          ws: this.ws,
          schoolAdminRepo,
        });

        await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Grade updated successfully.',
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async upsertSchoolGrade(@Args('input') input: UpdateSchoolGradeInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo }) => {
        const useCase = new UpdateSchoolGradeUseCase({
          schoolRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          ws: this.ws,
          schoolAdminRepo,
        });

        await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Grade updated successfully.',
    };
  }

  @Query(() => [School])
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async schools(@Args() args: SchoolsArgs, @CurrentUser() user: ICurrentUser) {
    const validation = SchoolsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolsUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => School, { nullable: true })
  async school(@Args() args: SchoolArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          schoolRepo: new SchoolRepository(db),
        };
      },
      callback: async ({ schoolRepo }) => {
        const validation = SchoolSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new GetSchoolUseCase({ schoolRepo });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return data;
  }

  @Query(() => Int)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async totalSchools(@Args() args: SchoolsArgs, @CurrentUser() user: ICurrentUser) {
    const validation = SchoolsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new TotalSchoolsUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @ResolveField(() => [SchoolCarriculum])
  async curriculums(@Parent() school: School) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          schoolRepo: new SchoolRepository(db),
        };
      },
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolCarriculumsUseCase({ schoolRepo });

        const data = await useCase.execute({
          data: {
            schoolId: school.id,
          },
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => [SchoolGrade])
  async grades(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolGradesUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => SchoolStats)
  async stats(@Parent() school: School) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolStatsUseCase({ schoolRepo });

        const data = await useCase.execute({
          data: {
            schoolId: school.id,
          },
        });

        return data;
      },
    });

    return data;
  }

  @Mutation(() => ToggleSchoolActivationResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  @RequirePermissions('school:toggle_status')
  async toggleSchoolActivation(@Args() args: ToggleSchoolActivationArgs, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        sessionRepo: new SessionRepository(db),
        notificationRepo: new NotificationRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ schoolRepo, sessionRepo, notificationRepo, platformUserRepo }) => {
        const validation = ToggleSchoolActivationSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new ToggleSchoolActivationUseCase({ schoolRepo, sessionRepo, notificationRepo, ws: this.ws, platformUserRepo, dbService: this.dbService });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'School activation status has been toggled.',
    };
  }

  @ResolveField(() => BusinessPhaseAverageScore)
  async businessPhaseAvgScores(@Parent() school: School) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetAverageBusinessScoresUseCase({ schoolRepo });

        return await useCase.execute({
          data: { schoolId: school.id },
        });
      },
    });
  }

  @ResolveField(() => AcademicYear, { nullable: true })
  async currentAcademicYear(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetAcademicYearUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            academicYearId: school.currentAYId,
          },
          user,
        });
      },
    });
  }

  @Query(() => [AcademicYear])
  @IsPrivate()
  async academicYears(@Args() args: AcademicYearsArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const validation = AcademicYearsSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new AcademicYearsUseCase({ schoolRepo });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => [EnrollmentStatus])
  async enrollmentStatus() {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetEnrollmentStatusUseCase({
          schoolRepo,
        });

        return await useCase.execute();
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async promoteSchool(@Args('input') input: PromoteSchoolInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async () => ({
        schoolPromoteService: new SchoolPromoteService(this.dbService, this.emailService, this.ws),
      }),
      callback: async ({ schoolPromoteService }) => {
        const useCase = new PromoteSchoolUseCase({
          schoolPromoteService,
        });

        return await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Promotion job completed successfully',
    };
  }

  @ResolveField(() => AchievedBadge, { nullable: true })
  async currentBadge(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        badgeRepo: new BadgeRepository(db),
      }),
      callback: async ({ businessRepo, badgeRepo }) => {
        const useCase = new GetSchoolCurrentBadgeUseCase({
          businessRepo,
          badgeRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Number, { nullable: true })
  async overallGradeScoreChosen(@Parent() school: School, @Args() args: GradeLevel2ReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetOverallGradeScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            ...args,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => PerformanceProgression, { nullable: true })
  async gradePerformanceProgressionChosen(@Parent() school: School, @Args() args: GradeLevel2ReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetGradePerformanceProgressionUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            ...args,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Number, { nullable: true })
  async overallSchoolScore(@Args('status', { nullable: true, type: () => BusinessStatus }) status: BusinessStatus, @Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetOverallSchoolScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => PerformanceProgression, { nullable: true })
  async schoolPerformanceProgression(
    @Parent() school: School,
    @CurrentUser() user: ICurrentUser,
    @Args('status', { nullable: true, type: () => BusinessStatus }) status: BusinessStatus,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetSchoolPerformanceProgressionUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalStudents(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new TotalStudentsUseCase({ studentRepo });
        return await useCase.execute({
          data: {
            schoolId: school.id,
            enrollmentStatus: 'active',
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalTeachers(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new TotalTeachersUseCase({ teacherRepo });
        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalGrades(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new TotalGradesUseCase({ schoolRepo });
        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalSections(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new TotalSectionsUseCase({ schoolRepo });
        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalUniqueBusinessIdeas(@Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetUniqueBusinessCountUseCase({ businessRepo });
        return await useCase.execute({
          data: {
            schoolId: school.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => OverallSchoolPhaseScores, { nullable: true })
  async overallSchoolPhaseScores(@Args('input') input: OverallSchoolPhaseScoresInput, @Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetOverallSchoolPhaseScoresUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            ...input,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Business], { nullable: true })
  async topPerformedBusinesses(@Args('input', { nullable: true }) input: TopPerformedBusinessesArgs, @Parent() school: School, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetTopPerformedBusinessesUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: school.id,
            ...input,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => AIGeneratedFeedback, { nullable: true })
  async aiGeneratedFeedback(
    @Parent() school: School,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, aiPerformanceFeedbackRepo }) => {
        const useCase = new GetSchoolPerformanceAiFeedbackUseCase({
          businessRepo,
          aiPerformanceFeedbackRepo,
          aiPerformanceFeedbackService: new AiPerformanceFeedbackService({
            amqpConnection: this.amqpConnection,
          }),
        });

        return useCase.execute({
          data: {
            schoolId: school.id,
            status,
          },
          user,
        });
      },
    });
  }
}
