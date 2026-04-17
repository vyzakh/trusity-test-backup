import { AiPerformanceFeedbackService } from '@application/services';
import {
  GetClassPerformanceProgressionUseCase,
  GetClassPerformanceScoreUseCase,
  GetGradePerformanceProgressionUseCase,
  GetGradePerformanceScoreUseCase,
  GetSchoolGradesUseCase,
  GetSchoolSectionsUseCase,
  GetStudentsUseCase,
  TotalStudentsUseCase,
  TotalTeachersUseCase,
} from '@application/use-cases';
import { GetBusinessLearningPhasesUseCase } from '@application/use-cases/business-learning/get-business-learning-phases.use-case';
import { GetTopPerformedBusinessesUseCase } from '@application/use-cases/business/get-top-performed-businesses.use-case';
import { GetUniqueBusinessCountUseCase } from '@application/use-cases/business/get-unique-business-count.use-case';
import { GetGradePerformanceAiFeedbackUseCase, GetSectionPerformanceAiFeedbackUseCase } from '@application/use-cases/feedback';
import { GetBusinessPhaseLockStatusUseCase } from '@application/use-cases/school/get-business-phase-lock-status.use-case';
import { GetOverallGradeScoreUseCase } from '@application/use-cases/school/get-overall-grade-score.use-case';
import { GetOverallSectionScoreUseCase } from '@application/use-cases/school/get-overall-section-score.use-case';
import { GetSectionBadgeUseCase } from '@application/use-cases/school/get-section-badge';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  AiPerformanceFeedbackRepository,
  BadgeRepository,
  BusinessLearningRepository,
  BusinessPhaseLockRepository,
  BusinessRepository,
  DatabaseService,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
} from '@infrastructure/database';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ICurrentUser } from 'src/core/types';
import { AchievedBadge } from '../badge/types/badge.type';
import { Business } from '../business/types';
import { BusinessLearningPhase } from '../business/types/business-learning.type';
import { BusinessPhaseLockStatus } from '../business/types/business-lock.types';
import { StudentFilterArgs } from '../common/types/student.type';
import { Student } from '../student/types';
import { SchoolGradesArgs } from './dto/school-grades.args';
import {
  AIGeneratedFeedback,
  ClassPerformanceScore,
  GradeLevelFeedbacktArgs,
  GradeLevelReportArgs,
  GradePerformanceScore,
  PerformanceProgression,
  SchoolGrade,
  SchoolSection,
} from './types';

@Resolver(() => SchoolGrade)
export class SchoolGradeResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @ResolveField(() => Int)
  async totalStudents(@Args() args: StudentFilterArgs, @Parent() schoolGrade: SchoolGrade, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new TotalStudentsUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            ...args,
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [SchoolSection])
  async sections(@Parent() schoolGrade: SchoolGrade, @Args('sectionIds', { type: () => [Int], nullable: true }) sectionIds: number[], @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolSectionsUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            sectionIds,
          },
          user,
        });
      },
    });
  }

  @Query(() => [SchoolGrade])
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT)
  async schoolGrades(@Args() args: SchoolGradesArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolGradesUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: args,
          user,
        });
      },
    });
  }

  @ResolveField(() => Int)
  async totalUniqueBusinesses(@Parent() schoolGrade: SchoolGrade, @Args('academicYearId', { nullable: true }) academicYearId: string, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetUniqueBusinessCountUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            academicYearId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Number, { nullable: true })
  async overallGradeScore(@Parent() schoolGrade: SchoolGrade, @Args() args: GradeLevelReportArgs, @CurrentUser() user: ICurrentUser) {
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
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            ...args,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => GradePerformanceScore, { nullable: true })
  async gradePerformanceScore(
    @Parent() schoolGrade: SchoolGrade,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetGradePerformanceScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => PerformanceProgression, { nullable: true })
  async gradePerformanceProgression(@Parent() schoolGrade: SchoolGrade, @Args() args: GradeLevelReportArgs, @CurrentUser() user: ICurrentUser) {
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
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            ...args,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Business], { nullable: true })
  async topPerformedBusinesses(
    @Parent() schoolGrade: SchoolGrade,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
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
            schoolId: schoolGrade.schoolId,
            gradeId: schoolGrade.grade.id,
            status,
          },
          user,
        });
      },
    });
  }

  @Query(() => AIGeneratedFeedback, { nullable: true })
  async gradeLevelAiGeneratedFeedback(@Args() args: GradeLevelFeedbacktArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        schoolRepo: new SchoolRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, schoolRepo, aiPerformanceFeedbackRepo }) => {
        const useCase = new GetGradePerformanceAiFeedbackUseCase({
          businessRepo,
          schoolRepo,
          aiPerformanceFeedbackService: new AiPerformanceFeedbackService({
            amqpConnection: this.amqpConnection,
          }),
          aiPerformanceFeedbackRepo,
        });

        return useCase.execute({
          data: args,
          user,
        });
      },
    });
  }

  @ResolveField(() => [BusinessLearningPhase])
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
}

@Resolver(() => SchoolSection)
export class SchoolSectionResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @ResolveField(() => Int)
  async totalStudents(@Args() args: StudentFilterArgs, @Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new TotalStudentsUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            ...args,
            schoolId: schoolSection.schoolId,
            gradeId: schoolSection.gradeId,
            sectionId: schoolSection.section.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int)
  async totalTeachers(@Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new TotalTeachersUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            gradeId: schoolSection.gradeId,
            sectionId: schoolSection.section.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Student], { nullable: true })
  async students(@Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentsUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            gradeId: schoolSection.gradeId,
            sectionId: schoolSection.section.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => AchievedBadge, { nullable: true })
  async currentBadge(@Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        badgeRepo: new BadgeRepository(db),
      }),
      callback: async ({ businessRepo, badgeRepo }) => {
        const useCase = new GetSectionBadgeUseCase({
          businessRepo,
          badgeRepo,
        });

        return await useCase.execute({
          data: {
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
            schoolId: schoolSection.schoolId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Number, { nullable: true })
  async overallSectionScore(
    @Parent() schoolSection: SchoolSection,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetOverallSectionScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => ClassPerformanceScore, { nullable: true })
  async classPerformanceScore(
    @Parent() schoolSection: SchoolSection,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetClassPerformanceScoreUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => PerformanceProgression, { nullable: true })
  async classPerformanceProgression(
    @Parent() schoolSection: SchoolSection,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetClassPerformanceProgressionUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Business], { nullable: true })
  async topPerformedBusinesses(
    @Parent() schoolSection: SchoolSection,
    @Args('status', { type: () => BusinessStatus, nullable: true })
    status: BusinessStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
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
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [BusinessPhaseLockStatus!])
  async businessPhaseLockStatus(@Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
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
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int, { nullable: true })
  async totalUniqueBusinessIdeas(@Parent() schoolSection: SchoolSection, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetUniqueBusinessCountUseCase({ businessRepo });
        return await useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            sectionId: schoolSection.section.id,
            gradeId: schoolSection.gradeId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => AIGeneratedFeedback, { nullable: true })
  async aiGeneratedFeedback(
    @Parent() schoolSection: SchoolSection,
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
        const useCase = new GetSectionPerformanceAiFeedbackUseCase({
          businessRepo,
          aiPerformanceFeedbackService: new AiPerformanceFeedbackService({
            amqpConnection: this.amqpConnection,
          }),
          aiPerformanceFeedbackRepo,
        });

        return useCase.execute({
          data: {
            schoolId: schoolSection.schoolId,
            gradeId: schoolSection.gradeId,
            sectionId: schoolSection.section.id,
            status,
          },
          user,
        });
      },
    });
  }
}
