import {
  AcademicYearsUseCase,
  CreateStudentUseCase,
  DeleteStudentUseCase,
  GetChallengesUseCase,
  GetGradeUseCase,
  GetSchoolUseCase,
  GetSectionUseCase,
  GetStudentGradeUseCase,
  GetStudentSectionUseCase,
  GetStudentUseCase,
  GetStudentsUseCase,
  TotalStudentsUseCase,
  UpdateStudentUseCase,
} from '@application/use-cases';
import { GetBusinessesUseCase } from '@application/use-cases/business/get-businesses.use-case';
import { GetTopPerformedBusinessesUseCase } from '@application/use-cases/business/get-top-performed-businesses.use-case';
import { TotalBusinessesUseCase } from '@application/use-cases/business/total-businesses-use-case';
import { GetEnrollmentStatusUseCase } from '@application/use-cases/common/get-enrollment-status.use-case';
import { GetAcademicYearUseCase } from '@application/use-cases/school/get-academic-year.use-case';
import { GetBusinessPhaseLockStatusUseCase } from '@application/use-cases/school/get-business-phase-lock-status.use-case';
import { GetAverageBusinessScoresUseCase } from '@application/use-cases/school/get-school-avarage-business-scores.use-case';
import { BulkUploadStundetsUseCase } from '@application/use-cases/student/bulk-upload-students.use-case';
import { CanDemoteStudentUseCase } from '@application/use-cases/student/can-demote-student.use-case';
import { DemoteStudentsUseCase } from '@application/use-cases/student/demote-students.use-case';
import { GetOverallBusinessReportUseCase } from '@application/use-cases/student/get-overall-business-report.use-case';
import { GetStudentAcademicHistoryUseCase } from '@application/use-cases/student/get-student-academic-history.use-case';
import { GetStudentCurrentAcademicYearUseCase } from '@application/use-cases/student/get-student-academic-year.use-case';
import { GetStudentBadgeUseCase } from '@application/use-cases/student/get-student-badge.use-case';
import { GetStudentBusinessStatsUseCase } from '@application/use-cases/student/get-student-business-stats.use-case';
import { GetStudentChallengeStatsUseCase } from '@application/use-cases/student/get-student-challenge-stats.use-case';
import { GetStudentTotalAverageScoreUseCase } from '@application/use-cases/student/get-total-avg-score.use-case';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import {
  BadgeRepository,
  BusinessPhaseLockRepository,
  BusinessRepository,
  ChallengeRepository,
  DatabaseService,
  EnrollmentRepository,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { AcademicYearRepository } from '@infrastructure/database/repositories/academic-year.repository';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Context, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessStatus, UserScope } from '@shared/enums';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentUser } from 'src/core/types';
import { AchievedBadge } from '../badge/types/badge.type';
import { BusinessesSchema, TotalBusinessesSchema } from '../business/schemas/business.schema';
import { Business, BusinessesArgs, TotalBusinessesArgs } from '../business/types';
import { BusinessPhaseLockStatus } from '../business/types/business-lock.types';
import { Challenge } from '../challenge/types';
import { EnrollmentStatus, Grade, Section } from '../common/types';
import { AcademicYear } from '../common/types/academic-year.type';
import { BusinessPhaseAverageScore, School } from '../school/types';
import { CreateStudentInput, DeleteStudentArgs, StudentsArgs, UpdateStudentInput } from './dto';
import { CreateStudentSchema, DeleteStudentSchema, StudentsSchema, UpdateStudentSchema } from './schemas';
import {
  BulkUploadStudentsInput,
  BulkUploadStudentsResult,
  CreateStudentResult,
  DemoteStudentsInput,
  OverallBusinessReport,
  Student,
  StudentAcademicHistory,
  StudentBusinessStats,
  StudentChallengeStats,
  UpdateStudentResult,
} from './types';

@Resolver(() => Student)
export class StudentResolver {
  constructor(
    private emailService: EmailService,
    private dbService: DatabaseService,
    private readonly ws: WSGateway,
    private s3Service: S3Service,
  ) {}

  @Mutation(() => CreateStudentResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async createStudent(@Args('input') input: CreateStudentInput, @CurrentUser() user: ICurrentUser) {
    const validation = CreateStudentSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        studentRepo: new StudentRepository(db),
        schoolRepo: new SchoolRepository(db),
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ userAccountRepo, studentRepo, schoolRepo, lookupRepo }) => {
        const useCase = new CreateStudentUseCase({
          logger: new Logger(CreateStudentUseCase.name),
          dbService: this.dbService,
          studentRepo,
          userAccountRepo,
          emailService: this.emailService,
          schoolRepo,
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
      message: 'Successfully created student',
      student: data,
    };
  }

  @Mutation(() => UpdateStudentResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async updateStudent(@Args('input') input: UpdateStudentInput, @CurrentUser() user: ICurrentUser) {
    const validation = UpdateStudentSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        studentRepo: new StudentRepository(db),
        enrollmentRepo: new EnrollmentRepository(db),
      }),
      callback: async ({ studentRepo, userAccountRepo, enrollmentRepo }) => {
        const useCase = new UpdateStudentUseCase({
          logger: new Logger(UpdateStudentUseCase.name),
          dbService: this.dbService,
          studentRepo,
          userAccountRepo,
          ws: this.ws,
          enrollmentRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated student',
      student: data,
    };
  }

  @Query(() => Student, { nullable: true })
  @IsPrivate()
  async student(@Args('studentId', { nullable: true }) studentId: string, @CurrentUser() user: ICurrentUser) {
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
            studentId,
          },
          user,
        });
      },
    });
  }

  @Query(() => [Student])
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async students(@Args() args: StudentsArgs, @CurrentUser() user: ICurrentUser) {
    const validation = StudentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentsUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @ResolveField(() => Grade, { nullable: true })
  async grade(
    @Parent() student: Student,
    @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string,
    @Args('enrollmentStatus', { type: () => EnrollmentStatusEnum, nullable: true }) enrollmentStatus: EnrollmentStatusEnum,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentGradeUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
            academicYearId,
            enrollmentStatus,
          },
        });
      },
    });
  }

  @ResolveField(() => Section, { nullable: true })
  async section(
    @Parent() student: Student,
    @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string,
    @Args('enrollmentStatus', { type: () => EnrollmentStatusEnum, nullable: true }) enrollmentStatus: EnrollmentStatusEnum,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentSectionUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
            academicYearId,
            enrollmentStatus,
          },
        });
      },
    });
  }

  @ResolveField(() => School, { nullable: true })
  async school(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolUseCase({
          schoolRepo,
        });

        const data = await useCase.execute({
          data: {
            schoolId: student.schoolId,
          },
          user,
        });

        return data;
      },
    });

    return data;
  }

  @Query(() => Int)
  @IsPrivate()
  async totalStudents(@Args() args: StudentsArgs, @CurrentUser() user: ICurrentUser) {
    const validation = StudentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          studentRepo: new StudentRepository(db),
        };
      },
      callback: async ({ studentRepo }) => {
        const useCase = new TotalStudentsUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async deleteStudent(@Args() args: DeleteStudentArgs, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        userAccountRepo: new UserAccountRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        sessionRepo: new SessionRepository(db),
      }),
      callback: async ({ userAccountRepo, studentRepo, schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo, sessionRepo }) => {
        const validation = DeleteStudentSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new DeleteStudentUseCase({
          dbService: this.dbService,
          userAccountRepo,
          studentRepo,
          schoolRepo,
          notificationRepo,
          schoolAdminRepo,
          ws: this.ws,
          platformUserRepo,
          emailService: this.emailService,
          sessionRepo,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'The student record has been successfully removed.',
    };
  }

  @ResolveField(() => StudentBusinessStats)
  async businessStats(@Parent() student: Student, @CurrentUser() user: ICurrentUser, @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetStudentBusinessStatsUseCase({
          businessRepo,
        });

        return useCase.execute({
          data: {
            studentId: student.id,
            academicYearId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => StudentChallengeStats)
  async challengeStats(@Parent() student: Student) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentChallengeStatsUseCase({ studentRepo });

        return await useCase.execute({
          data: { studentId: student.id },
        });
      },
    });

    return data;
  }

  @ResolveField(() => Number, { nullable: true })
  async totalAvgScore(
    @Parent() student: Student,
    @Args('status', { type: () => BusinessStatus, nullable: true }) status: BusinessStatus,
    @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetStudentTotalAverageScoreUseCase({
          businessRepo,
        });

        return useCase.execute({
          data: {
            studentId: student.id,
            status,
            academicYearId,
          },
          user,
        });
      },
    });
  }
  @ResolveField(() => BusinessPhaseAverageScore, { nullable: true })
  async businessPhaseAvgScores(@Parent() student: Student, @Context() context: any) {
    const businessStatus = context.req?.body?.variables?.businessStatus?.toLowerCase();

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetAverageBusinessScoresUseCase({ schoolRepo });

        const result = await useCase.execute({
          data: { studentId: student.id, businessStatus: businessStatus },
        });
        return result;
      },
    });
  }

  @ResolveField(() => [AcademicYear])
  async academicYears(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new AcademicYearsUseCase({ schoolRepo });

        return await useCase.execute({
          data: {
            studentId: student.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Challenge], { nullable: true })
  async challenges(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengesUseCase({ challengeRepo });

        return await useCase.execute({
          data: {},
          user,
        });
      },
    });
  }

  @ResolveField(() => [Business])
  async businesses(@Args() args: BusinessesArgs, @Parent() student: Student, @CurrentUser() user: ICurrentUser) {
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
          data: {
            ...validation.data,
            studentId: student.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int)
  async totalBusinesses(@Args() args: TotalBusinessesArgs, @Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    const validation = TotalBusinessesSchema.safeParse(args);
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
          data: {
            ...validation.data,
            studentId: student.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Business], { nullable: true })
  async topPerformedBusinesses(
    @Parent() student: Student,
    @Args('status', { type: () => BusinessStatus, nullable: true }) status: BusinessStatus,
    @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string,
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

        return useCase.execute({
          data: {
            studentId: student.id,
            status,
            academicYearId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [BusinessPhaseLockStatus!])
  async businessPhaseLockStatus(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
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
            studentId: student.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => OverallBusinessReport, { nullable: true })
  async overallBusinessReport(
    @Parent() student: Student,
    @CurrentUser() user: ICurrentUser,
    @Args('academicYearId', { type: () => String, nullable: true }) academicYearId: string,
  ) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GetOverallBusinessReportUseCase({
          businessRepo,
        });

        return useCase.execute({
          data: {
            studentId: student.id,
            academicYearId,
          },
          user,
        });
      },
    });
  }

  @Mutation(() => BulkUploadStudentsResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async bulkUploadStudents(@Args('input') input: BulkUploadStudentsInput, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
        schoolRepo: new SchoolRepository(db),
        studentRepo: new StudentRepository(db),
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ lookupRepo, schoolRepo, studentRepo, userAccountRepo }) => {
        const useCase = new BulkUploadStundetsUseCase({
          emailService: this.emailService,
          lookupRepo,
          schoolRepo,
          studentRepo,
          userAccountRepo,
          dbService: this.dbService,
          ws: this.ws,
          s3Service: this.s3Service,
        });

        return await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      students: data,
      message: 'Successfully bulk uploaded students',
    };
  }

  @ResolveField(() => AcademicYear, { nullable: true })
  async currentAcademicYear(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentCurrentAcademicYearUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
          },
        });
      },
    });
  }

  @ResolveField(() => Boolean, { nullable: true })
  async canDemote(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async (params) => ({
        studentRepo: new StudentRepository(params.db),
        lookupRepo: new LookupRepository(params.db),
        academicYearRepo: new AcademicYearRepository(params.db),
      }),
      callback: async (deps) => {
        const useCase = new CanDemoteStudentUseCase(deps);

        return await useCase.execute({
          data: {
            studentId: student.id,
          },
          user,
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async demoteStudents(@Args('input') input: DemoteStudentsInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async (params) => ({
        studentRepo: new StudentRepository(params.db),
        lookupRepo: new LookupRepository(params.db),
        academicYearRepo: new AcademicYearRepository(params.db),
      }),
      callback: async (deps) => {
        const useCase = new DemoteStudentsUseCase(deps);

        return await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Students demoted successfully',
    };
  }

  @ResolveField(() => AchievedBadge, { nullable: true })
  async achievedBadge(@Args('academicYearId', { nullable: true }) academicYearId: string, @Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        badgeRepo: new BadgeRepository(db),
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ badgeRepo, businessRepo }) => {
        const useCase = new GetStudentBadgeUseCase({
          badgeRepo,
          businessRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
            academicYearId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => [StudentAcademicHistory], { nullable: true })
  async academicHistory(@Parent() student: Student, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ studentRepo }) => {
        const useCase = new GetStudentAcademicHistoryUseCase({
          studentRepo,
        });

        return await useCase.execute({
          data: {
            studentId: student.id,
          },
          user,
        });
      },
    });
  }
}

@Resolver(() => StudentAcademicHistory)
export class StudentAcademicHistoryResolver {
  constructor(private dbService: DatabaseService) {}

  @ResolveField(() => AcademicYear, { nullable: true })
  async academicYear(@Parent() studentAcademicHistory: StudentAcademicHistory, @CurrentUser() user: ICurrentUser) {
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
            schoolId: studentAcademicHistory.schoolId,
            academicYearId: studentAcademicHistory.academicYearId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Grade, { nullable: true })
  async grade(@Parent() studentAcademicHistory: StudentAcademicHistory) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetGradeUseCase({
          lookupRepo,
        });

        return await useCase.execute({
          data: {
            gradeId: studentAcademicHistory.gradeId,
          },
        });
      },
    });
  }

  @ResolveField(() => Section, { nullable: true })
  async section(@Parent() studentAcademicHistory: StudentAcademicHistory) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetSectionUseCase({
          lookupRepo,
        });

        return await useCase.execute({
          data: {
            sectionId: studentAcademicHistory.sectionId,
          },
        });
      },
    });
  }

  @ResolveField(() => EnrollmentStatus, { nullable: true })
  async enrollmentStatus(@Parent() studentAcademicHistory: StudentAcademicHistory) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetEnrollmentStatusUseCase({
          lookupRepo,
        });

        return await useCase.execute({
          data: {
            enrollmentStatusId: studentAcademicHistory.enrollmentStatusId,
          },
        });
      },
    });
  }
}
