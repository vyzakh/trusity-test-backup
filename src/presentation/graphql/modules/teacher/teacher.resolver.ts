import {
  CreateTeacherUseCase,
  DeleteTeacherUseCase,
  GetSchoolUseCase,
  GetTeacherGradeSectionsUseCase,
  GetTeacherGradesUseCase,
  GetTeacherUseCase,
  GetTeachersUseCase,
  TotalStudentsUseCase,
  TotalTeachersUseCase,
  UpdateTeacherUseCase,
} from '@application/use-cases';
import { GetOverallSectionScoreUseCase } from '@application/use-cases/school/get-overall-section-score.use-case';
import { GetSectionBadgeUseCase } from '@application/use-cases/school/get-section-badge';
import { ICurrentUser } from '@core/types';
import {
  BadgeRepository,
  BusinessRepository,
  DatabaseService,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessStatus, UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { AchievedBadge } from '../badge/types/badge.type';
import { StudentFilterArgs } from '../common/types/student.type';
import { School } from '../school/types';
import { CreateTeacherInput, TeachersArgs, UpdateTeacherInput } from './dto';
import { CreateTeacherSchema, TeachersSchema, UpdateTeacherSchema } from './schemas';
import { CreateTeacherResult, Teacher, TeacherGrade, TeacherSection, UpdateTeacherResult } from './types';

@Resolver(() => Teacher)
export class TeacherResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
  ) {}

  @Mutation(() => CreateTeacherResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async createTeacher(@Args('input') input: CreateTeacherInput, @CurrentUser() user: ICurrentUser) {
    const validation = CreateTeacherSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        teacherRepo: new TeacherRepository(db),
        schoolRepo: new SchoolRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ userAccountRepo, teacherRepo, schoolRepo, platformUserRepo, schoolAdminRepo, notificationRepo }) => {
        const useCase = new CreateTeacherUseCase({
          teacherRepo,
          userAccountRepo,
          platformUserRepo,
          notificationRepo,
          schoolRepo,
          schoolAdminRepo,
          dbService: this.dbService,
          emailService: this.emailService,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully created teacher',
      teacher: data,
    };
  }

  @Mutation(() => UpdateTeacherResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async updateTeacher(@Args('input') input: UpdateTeacherInput, @CurrentUser() user: ICurrentUser) {
    const validation = UpdateTeacherSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        teacherRepo: new TeacherRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        sessionRepo: new SessionRepository(db),
      }),
      callback: async ({ teacherRepo, userAccountRepo, platformUserRepo, schoolAdminRepo, notificationRepo, sessionRepo }) => {
        const useCase = new UpdateTeacherUseCase({
          teacherRepo,
          userAccountRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          dbService: this.dbService,
          ws: this.ws,
          schoolAdminRepo,
          sessionRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated teacher',
      teacher: data,
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async deleteTeacher(@Args('teacherId') teacherId: string, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        teacherRepo: new TeacherRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        sessionRepo: new SessionRepository(db),
      }),
      callback: async ({ userAccountRepo, teacherRepo, platformUserRepo, schoolAdminRepo, notificationRepo, sessionRepo }) => {
        const useCase = new DeleteTeacherUseCase({
          userAccountRepo,
          teacherRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          dbService: this.dbService,
          ws: this.ws,
          schoolAdminRepo,
          sessionRepo,
        });

        await useCase.execute({
          data: {
            teacherId,
          },
          user,
        });
      },
    });

    return {
      message: 'Successfully deleted teacher',
    };
  }

  @Query(() => [Teacher])
  @IsPrivate()
  async teachers(@Args() args: TeachersArgs, @CurrentUser() user: ICurrentUser) {
    const validation = TeachersSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new GetTeachersUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => Teacher, { nullable: true })
  @IsPrivate()
  async teacher(@Args('teacherId') teacherId: string, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new GetTeacherUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: {
            teacherId,
          },
          user,
        });
      },
    });
  }

  @Query(() => Int)
  @IsPrivate()
  async totalTeachers(@Args() args: TeachersArgs, @CurrentUser() user: ICurrentUser) {
    const validation = TeachersSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new TotalTeachersUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @ResolveField(() => [TeacherGrade])
  async grades(@Parent() teacher: Teacher, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new GetTeacherGradesUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: {
            teacherId: teacher.id,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => School, { nullable: true })
  async school(@Parent() teacher: Teacher, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        const useCase = new GetSchoolUseCase({
          schoolRepo,
        });

        return await useCase.execute({
          data: {
            schoolId: teacher.schoolId,
          },
          user,
        });
      },
    });
  }
}

@Resolver(() => TeacherGrade)
export class TeacherGradeResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [TeacherSection])
  async sections(@Parent() teacherGrade: TeacherGrade, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new GetTeacherGradeSectionsUseCase({
          teacherRepo,
        });

        return await useCase.execute({
          data: {
            teacherId: teacherGrade.teacherId,
            gradeId: teacherGrade.grade.id,
          },
          user,
        });
      },
    });
  }
}

@Resolver(() => TeacherSection)
export class TeacherSectionResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => AchievedBadge, { nullable: true })
  async currentBadge(@Parent() teacherSection: TeacherSection, @CurrentUser() user: ICurrentUser) {
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
            sectionId: teacherSection.section.id,
            gradeId: teacherSection.gradeId,
            schoolId: teacherSection.schoolId,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Number, { nullable: true })
  async overallSectionScore(
    @Parent() teacherSection: TeacherSection,
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
            schoolId: teacherSection.schoolId,
            sectionId: teacherSection.section.id,
            gradeId: teacherSection.gradeId,
            status,
          },
          user,
        });
      },
    });
  }

  @ResolveField(() => Int)
  async totalStudents(@Args() args: StudentFilterArgs, @Parent() teacherSection: TeacherSection, @CurrentUser() user: ICurrentUser) {
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
            schoolId: teacherSection.schoolId,
            gradeId: teacherSection.gradeId,
            sectionId: teacherSection.section.id,
          },
          user,
        });
      },
    });
  }
}
