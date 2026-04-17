import { ExportClassLevelReportUseCase, ExportGradeLevelReportUseCase } from '@application/use-cases/report';
import { ExportSchoolPerformanceReportUseCase } from '@application/use-cases/report/export-school-performance-report.use-case';
import { SendStudentPerfomanceReportToGuardianUseCase } from '@application/use-cases/report/send-student-perfomance-report-to-guardian.use-case';
import { ExportStudentPerformanceReportUseCase } from '@application/use-cases/student/export-student-performance-report.use-case';
import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { AiPerformanceFeedbackRepository, BusinessRepository, DatabaseService, SchoolRepository, StudentRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { BaseResult, DownloadFileResult } from '@presentation/graphql/shared/types/base-result.type';
import { CurrentUser, IsPrivate, RequirePermissions, Scopes } from '@shared/decorators';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ExportClassLevelReportArgs, ExportGradeLevelReportArgs, ExportStudentPerformanceReportInput, SendStudentPerfomanceReportArgs } from '../types/report.types';

@Resolver()
export class ReportResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private s3Service: S3Service,
    private emailService: EmailService,
  ) {}

  @Mutation(() => DownloadFileResult, { nullable: true })
  @IsPrivate()
  async exportStudentPerformanceReport(@Args('input') input: ExportStudentPerformanceReportInput, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        studentRepo: new StudentRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, studentRepo, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportStudentPerformanceReportUseCase({
          businessRepo,
          studentRepo,
          s3Service: this.s3Service,
          aiPerformanceFeedbackRepo: aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: {
            businessId: input.businessId,
            studentId: input.studentId,
            feedbackId: input.feedbackId,
            status: input.status,
            fileType: 'pdf',
          },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult, { nullable: true })
  @IsPrivate()
  async exportStudentPerformanceExcelReport(@Args('input') input: ExportStudentPerformanceReportInput, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        studentRepo: new StudentRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, studentRepo, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportStudentPerformanceReportUseCase({
          businessRepo,
          studentRepo,
          s3Service: this.s3Service,
          aiPerformanceFeedbackRepo: aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: {
            businessId: input.businessId,
            studentId: input.studentId,
            feedbackId: input.feedbackId,
            status: input.status,
            fileType: 'excel',
          },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  @RequirePermissions('report:generate_and_share')
  async exportClassLevelReport(@Args() args: ExportClassLevelReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        businessRepo: new BusinessRepository(db),
        s3Service: this.s3Service,
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ schoolRepo, studentRepo, businessRepo, s3Service, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportClassLevelReportUseCase({
          schoolRepo,
          studentRepo,
          businessRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: { ...args, fileType: 'pdf' },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  @RequirePermissions('report:generate_and_share')
  async exportClassLevelExcelReport(@Args() args: ExportClassLevelReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        businessRepo: new BusinessRepository(db),
        s3Service: this.s3Service,
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ schoolRepo, studentRepo, businessRepo, s3Service, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportClassLevelReportUseCase({
          schoolRepo,
          studentRepo,
          businessRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: { ...args, fileType: 'excel' },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  @RequirePermissions('report:generate_and_share')
  async exportGradeLevelReport(@Args() args: ExportGradeLevelReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
        s3Service: this.s3Service,
      }),
      callback: async ({ businessRepo, schoolRepo, studentRepo, aiPerformanceFeedbackRepo, s3Service }) => {
        const useCase = new ExportGradeLevelReportUseCase({
          businessRepo,
          schoolRepo,
          studentRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: { ...args, fileType: 'pdf' },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  @RequirePermissions('report:generate_and_share')
  async exportGradeLevelExcelReport(@Args() args: ExportGradeLevelReportArgs, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
        s3Service: this.s3Service,
      }),
      callback: async ({ businessRepo, schoolRepo, studentRepo, aiPerformanceFeedbackRepo, s3Service }) => {
        const useCase = new ExportGradeLevelReportUseCase({
          businessRepo,
          schoolRepo,
          studentRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: { ...args, fileType: 'excel' },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  @RequirePermissions('report:generate_and_share')
  async exportSchoolPerformanceReport(
    @CurrentUser() user: ICurrentUser,
    @Args('feedbackId', { type: () => String }) feedbackId: string,
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string | null,
    @Args('status', { type: () => BusinessStatus, nullable: true }) status?: BusinessStatus | null,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        schoolRepo: new SchoolRepository(db),
        s3Service: this.s3Service,
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, schoolRepo, s3Service, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportSchoolPerformanceReportUseCase({
          businessRepo,
          schoolRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: {
            schoolId,
            status,
            feedbackId,
            fileType: 'pdf'
          },
          user,
        });
      },
    });
  }

  @Mutation(() => DownloadFileResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  @RequirePermissions('report:generate_and_share')
  async exportSchoolPerformanceExcelReport(
    @CurrentUser() user: ICurrentUser,
    @Args('feedbackId', { type: () => String }) feedbackId: string,
    @Args('schoolId', { type: () => String, nullable: true }) schoolId?: string | null,
    @Args('status', { type: () => BusinessStatus, nullable: true }) status?: BusinessStatus | null,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        schoolRepo: new SchoolRepository(db),
        s3Service: this.s3Service,
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, schoolRepo, s3Service, aiPerformanceFeedbackRepo }) => {
        const useCase = new ExportSchoolPerformanceReportUseCase({
          businessRepo,
          schoolRepo,
          s3Service,
          aiPerformanceFeedbackRepo,
        });

        return await useCase.execute({
          data: {
            schoolId,
            status,
            feedbackId,
            fileType: 'excel'
          },
          user,
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  @RequirePermissions('report:generate_and_share')
  async sendStudentPerfomanceReportToGuardian(@Args() input: SendStudentPerfomanceReportArgs, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        studentRepo: new StudentRepository(db),
        aiPerformanceFeedbackRepo: new AiPerformanceFeedbackRepository(db),
      }),
      callback: async ({ businessRepo, studentRepo, aiPerformanceFeedbackRepo }) => {
        const useCase = new SendStudentPerfomanceReportToGuardianUseCase({
          businessRepo,
          studentRepo,
          emailService: this.emailService,
          aiPerformanceFeedbackRepo: aiPerformanceFeedbackRepo,
        });

        await useCase.execute({
          data: {
            businessId: input.businessId,
            studentId: input.studentId,
            feedbackId: input.feedbackId,
            status: input.status,
          },
          user,
        });
      },
    });

    return {
      message: 'Student performance report sent successfully to guardian',
    };
  }
}
