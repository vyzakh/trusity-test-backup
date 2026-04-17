import {
  AssignChallengeUseCase,
  CreateChallengeUseCase,
  GetChallengeAssignmentsUseCase,
  GetChallengeAssignmentUseCase,
  GetChallengeSdgsUseCase,
  GetChallengeSectorUseCase,
  GetChallengesUseCase,
  GetChallengeTargetGradesUseCase,
  GetChallengeUseCase,
  GetSchoolUseCase,
  HideTrusityChallengeUseCase,
  TotalChallengesUseCase,
  UpdateChallengeAssignmentUseCase,
} from '@application/use-cases';
import { DeleteChallengetUseCase } from '@application/use-cases/challenge/delete-challenge.use-case';
import { GetAssignedChallengeUseCase } from '@application/use-cases/challenge/get-assigned-challenge.use-case';
import { GetChallengeAssignedSchoolGradesUseCase } from '@application/use-cases/challenge/get-challenge-assigned-school-grade.use-case';
import { GetChallengeAssignedSchoolSectionsUseCase } from '@application/use-cases/challenge/get-challenge-assigned-school-sections.use-case';
import { GetChallengeAssignedSchoolsUseCase } from '@application/use-cases/challenge/get-challenge-assigned-schools.use-case';
import { GetChallengeCreatedByUseCase } from '@application/use-cases/challenge/get-challenge-created-by.use-case';
import { GetChallengeHiddenStatusUseCase } from '@application/use-cases/challenge/get-challenge-hidden-status.use-case';
import { GetChallengeParticipantsUseCase } from '@application/use-cases/challenge/get-challenge-participants.use-case';
import { GetChallengeStudentStatsUseCase } from '@application/use-cases/challenge/get-challenge-student-stats.use-case';
import { GetChallengeTargetSectionsUseCase } from '@application/use-cases/challenge/get-challenge-target-sections.use-case';
import { GetChallengeTargetStudentsUseCase } from '@application/use-cases/challenge/get-challenge-target-students.use-case';
import { TotalChallengeAssignmentsUseCase } from '@application/use-cases/challenge/total-challenge-assignments.use-case';
import { CountChallengeParticipantsUseCase } from '@application/use-cases/challenge/total-challenge-participants-count.use-case';
import { UnAssignChallengeUseCase } from '@application/use-cases/challenge/unassign-challenge.use-case';
import { UpdateChallengeUseCase } from '@application/use-cases/challenge/update-challenge.use-case';
import {
  BusinessRepository,
  ChallengeRepository,
  DatabaseService,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  SchoolRepository,
  StudentRepository,
  TeacherRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { ChallengeCreatorType, UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentSchoolAdminUser, ICurrentUser } from 'src/core/types';
import { ChallengeSector, Sdg } from '../common/types';
import { School, SchoolGrade, SchoolSection } from '../school/types';
import { Student } from '../student/types';
import { AssignChallengeInput, ChallengeArgs, ChallengesArgs, CreateChallengeArgs, UpdateChallengeAssignmentArgs } from './dto';
import { AssignmentsArgs, TotalAssignmentsArgs } from './dto/assignments.args';
import { ChallengeAssignedSchoolGradesArgs } from './dto/challenge-assigned-school-grades.args';
import { ChallengeAssignedSchoolSectionsArgs } from './dto/challenge-assigned-school-sections.args';
import { ChallengeAssignmentArgs } from './dto/challenge-assignment.args';
import { TotalChallengesArgs } from './dto/total-challenges.args';
import { UnAssignChallengeInput } from './dto/unassign-challenge.input';
import { UpdateChallengeArgs } from './dto/update-challenge.args';
import {
  AssignChallengeSchema,
  ChallengeSchema,
  ChallengesSchema,
  CreateChallengeSchema,
  HideChallengeSchema,
  TotalChallengesSchema,
  UnassignChallengeSchema,
  UpdateChallengeAssignmentSchema,
} from './schemas';
import { AssignmentsSchema, TotalAssignmentsSchema } from './schemas/assignments.schema';
import { ChallengeAssignmentSchema } from './schemas/challenge-assignment.schema';
import { UpdateChallengeSchema } from './schemas/update-challenge.schema';
import {
  AssignChallengeResult,
  Challenge,
  ChallengeAssignationInfo,
  ChallengeAssignedSchool,
  ChallengeAssignment,
  ChallengeCreatedByUnion,
  ChallengeStudentStats,
  ChallengeTargetGrade,
  ChallengeTargetSection,
  ChallengeTargetStudent,
  CreateChallengeResult,
  HideChallengeInput,
} from './types';
import { UpdateChallengeAssignmentResult } from './types/update-challenge-assignment-result.type';
import { UpdateChallengeResult } from './types/update-challenge-result.type';
@Resolver(() => Challenge)
export class ChallengeResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly ws: WSGateway,
  ) {}

  @Mutation(() => CreateChallengeResult)
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async createChallenge(@CurrentUser() user: ICurrentUser, @Args() args: CreateChallengeArgs) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
        studentRepo: new StudentRepository(db),
        notificationRepo: new NotificationRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ challengeRepo, studentRepo, platformUserRepo, notificationRepo, schoolAdminRepo, teacherRepo }) => {
        const validation = CreateChallengeSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new CreateChallengeUseCase({
          logger: new Logger(CreateChallengeUseCase.name),
          dbService: this.dbService,
          challengeRepo,
          studentRepo,
          platformUserRepo,
          notificationRepo,
          emailService: this.emailService,
          ws: this.ws,
          schoolAdminRepo,
          teacherRepo,
        });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return {
      message: 'Successfully created challenge',
      challenge: data,
    };
  }

  @Mutation(() => UpdateChallengeResult)
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT)
  async updateChallenge(@Args() args: UpdateChallengeArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,

      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
        lookupRepo: new LookupRepository(db),
        businessRepo: new BusinessRepository(db),
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ challengeRepo, lookupRepo, businessRepo, studentRepo }) => {
        const validation = UpdateChallengeSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new UpdateChallengeUseCase({
          logger: new Logger(UpdateChallengeUseCase.name),
          dbService: this.dbService,
          ws: this.ws,
          emailService: this.emailService,
          challengeRepo,
          lookupRepo,
          businessRepo,
          studentRepo,
        });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return {
      message: 'Successfully updated challenge',
      challenge: data,
    };
  }

  @Query(() => [Challenge])
  @IsPrivate()
  async challenges(@Args() args: ChallengesArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const validation = ChallengesSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new GetChallengesUseCase({ challengeRepo });

        const data = await useCase.execute({ data: validation.data, user });

        return data;
      },
    });

    return data;
  }

  @Query(() => Challenge, { nullable: true })
  @IsPrivate()
  async challenge(@Args() args: ChallengeArgs, @CurrentUser() user: ICurrentUser) {
    const validation = ChallengeSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeUseCase({ challengeRepo });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Query(() => Int)
  @IsPrivate()
  async totalChallenges(@Args() args: TotalChallengesArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          challengeRepo: new ChallengeRepository(db),
        };
      },
      callback: async ({ challengeRepo }) => {
        const validation = TotalChallengesSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new TotalChallengesUseCase({ challengeRepo });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => [Sdg])
  async sdgs(@Parent() challenge: Challenge) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeSdgsUseCase({ challengeRepo });

        const data = await useCase.execute({
          data: {
            challengeId: challenge.id,
          },
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => ChallengeSector, { nullable: true })
  async sector(@Parent() challenge: Challenge) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        lookupRepo: new LookupRepository(db),
      }),
      callback: async ({ lookupRepo }) => {
        const useCase = new GetChallengeSectorUseCase({ lookupRepo });

        const data = await useCase.execute({
          data: {
            challengeSectorId: challenge.sectorId,
          },
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => ChallengeCreatedByUnion, { nullable: true })
  async createdBy(@Parent() challenge: Challenge) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ userAccountRepo }) => {
        const useCase = new GetChallengeCreatedByUseCase({
          userAccountRepo,
        });

        return await useCase.execute({
          data: {
            userAccountId: challenge.createdBy,
            scope: challenge.creatorType,
          },
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async assignChallenge(@Args('input') input: AssignChallengeInput, @CurrentUser() user: ICurrentUser) {
    const validation = AssignChallengeSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ challengeRepo, studentRepo }) => {
        const useCase = new AssignChallengeUseCase({
          logger: new Logger(CreateChallengeUseCase.name),
          dbService: this.dbService,
          challengeRepo,
          studentRepo,
          emailService: this.emailService,
          ws: this.ws,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully assigned challenge',
    };
  }

  @Query(() => ChallengeAssignedSchool, { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async challengeAssignment(@Args() args: ChallengeAssignmentArgs, @CurrentUser() user: ICurrentUser) {
    const validation = ChallengeAssignmentSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeAssignmentUseCase({
          challengeRepo,
        });
        const data = await useCase.execute({
          data: validation.data,
          user,
        });
        return data;
      },
    });

    return data;
  }

  @Mutation(() => UpdateChallengeAssignmentResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async updateChallengeAssignment(@Args() args: UpdateChallengeAssignmentArgs) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const validation = UpdateChallengeAssignmentSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new UpdateChallengeAssignmentUseCase({ challengeRepo });

        await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Successfully updated challenge assignment',
    };
  }

  @Mutation(() => AssignChallengeResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async unassignChallenge(@Args('input') input: UnAssignChallengeInput, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
        studentRepo: new StudentRepository(db),
      }),
      callback: async ({ challengeRepo, studentRepo }) => {
        const validation = UnassignChallengeSchema.safeParse(input);
        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new UnAssignChallengeUseCase({ challengeRepo, studentRepo });
        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return { message: 'Successfully unassigned challenge' };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER)
  async deleteChallenge(@Args('challengeId') challengeId: string, @CurrentUser() user: ICurrentUser) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new DeleteChallengetUseCase({
          logger: new Logger(DeleteChallengetUseCase.name),
          dbService: this.dbService,
          ws: this.ws,
          emailService: this.emailService,
          challengeRepo,
        });

        return await useCase.execute({
          data: {
            challengeId,
          },
          user,
        });
      },
    });

    return {
      message: 'Successfully deleted challenge.',
    };
  }

  @ResolveField(() => School, { nullable: true })
  async school(@Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ schoolRepo }) => {
        switch (challenge.creatorType) {
          case ChallengeCreatorType.PLATFORM_USER: {
            return null;
          }
          case ChallengeCreatorType.SCHOOL_ADMIN:
          case ChallengeCreatorType.TEACHER: {
            const useCase = new GetSchoolUseCase({
              schoolRepo,
            });

            const data = await useCase.execute({
              data: {
                schoolId: challenge.schoolId,
              },
              user,
            });

            return data;
          }
          default: {
            return null;
          }
        }
      },
    });

    return data;
  }

  @ResolveField(() => [ChallengeTargetGrade], { nullable: true })
  async targetSchoolGrades(@Parent() challenge: Challenge) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeTargetGradesUseCase({
          challengeRepo,
        });

        return await useCase.execute({
          data: {
            challengeId: challenge.id,
          },
        });
      },
    });
  }

  @ResolveField(() => [ChallengeAssignment], { nullable: true })
  async assignments(@Args() args: AssignmentsArgs, @Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const validation = AssignmentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeAssignmentsUseCase({ challengeRepo });

        const data = await useCase.execute({
          data: { challengeId: challenge.id, ...validation.data },
          user,
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => Int)
  async totalAssignments(@Args() args: AssignmentsArgs, @Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const validation = AssignmentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new TotalChallengeAssignmentsUseCase({ challengeRepo });

        const data = await useCase.execute({
          data: { challengeId: challenge.id, ...validation.data },
          user,
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => [School])
  async assignedSchools(@Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeAssignedSchoolsUseCase({
          challengeRepo,
        });
        const data = await useCase.execute({
          data: { challengeId: challenge.id },
          user,
        });
        return data;
      },
    });

    return data;
  }

  @ResolveField(() => [SchoolGrade])
  async assignedGrades(@Parent() challenge: Challenge, @Args() args: ChallengeAssignedSchoolGradesArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeAssignedSchoolGradesUseCase({ challengeRepo });
        return await useCase.execute({
          data: {
            challengeId: challenge.id,
            ...args,
          },
          user,
        });
      },
    });

    return data;
  }

  @ResolveField(() => [SchoolSection])
  async assignedSections(@Parent() challenge: Challenge, @Args() args: ChallengeAssignedSchoolSectionsArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeAssignedSchoolSectionsUseCase({ challengeRepo });
        return await useCase.execute({
          data: {
            challengeId: challenge.id,
            ...args,
          },
          user,
        });
      },
    });

    return data;
  }

  @ResolveField(() => ChallengeStudentStats)
  async studentStats(@Parent() challenge: Challenge) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeStudentStatsUseCase({ challengeRepo });

        return await useCase.execute({
          data: { challengeId: challenge.id },
        });
      },
    });

    return data;
  }

  @ResolveField(() => ChallengeAssignationInfo, { nullable: true })
  async assignationInfo(@Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetAssignedChallengeUseCase({ challengeRepo });

        return await useCase.execute({
          data: { challengeId: challenge.id },
          user,
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.SCHOOL_ADMIN)
  async hideChallenge(@Args('input') input: HideChallengeInput, @CurrentUser() user: ICurrentSchoolAdminUser) {
    const validation = HideChallengeSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
        platformUserRepo: new PlatformUserRepository(db),
        notificationRepo: new NotificationRepository(db),
        schoolRepo: new SchoolRepository(db),
      }),
      callback: async ({ challengeRepo, platformUserRepo, notificationRepo, schoolRepo }) => {
        const useCase = new HideTrusityChallengeUseCase({
          challengeRepo,
          platformUserRepo,
          notificationRepo,
          schoolRepo,
          dbService:this.dbService,
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
      message: 'Challenge visibility updated successfully.',
    };
  }

  @ResolveField(() => Boolean)
  async isHidden(@Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeHiddenStatusUseCase({
          challengeRepo,
        });

        return await useCase.execute({
          data: { challengeId: challenge.id },
          user,
        });
      },
    });
  }

  @ResolveField(() => [Student])
  async participants(@Args() args: AssignmentsArgs, @Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const validation = AssignmentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeParticipantsUseCase({ challengeRepo });
        const data = await useCase.execute({
          data: { challengeId: challenge.id, ...validation.data },
          user,
        });
        return data;
      },
    });
    return data;
  }

  @ResolveField(() => Int)
  async totalParticipants(@Args() args: TotalAssignmentsArgs, @Parent() challenge: Challenge, @CurrentUser() user: ICurrentUser) {
    const validation = TotalAssignmentsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new CountChallengeParticipantsUseCase({ challengeRepo });
        return await useCase.execute({
          data: { challengeId: challenge.id, ...validation.data },
          user,
        });
      },
    });

    return data;
  }
}

@Resolver(() => ChallengeTargetGrade)
export class ChallengeTargetGradeResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [ChallengeTargetSection], { nullable: true })
  async targetSchoolSections(@Parent() grade: ChallengeTargetGrade) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeTargetSectionsUseCase({
          challengeRepo,
        });
        const data = await useCase.execute({
          data: {
            challengeId: grade.challengeId,
            gradeId: grade.grade.id,
          },
        });
        return data;
      },
    });
  }
}

@Resolver(() => ChallengeTargetSection)
export class ChallengeTargetSectionResolver {
  constructor(private readonly dbService: DatabaseService) {}

  @ResolveField(() => [ChallengeTargetStudent], { nullable: true })
  async targetStudents(@Parent() parent: ChallengeTargetSection) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        challengeRepo: new ChallengeRepository(db),
      }),
      callback: async ({ challengeRepo }) => {
        const useCase = new GetChallengeTargetStudentsUseCase({
          challengeRepo,
        });
        const data = await useCase.execute({
          data: {
            challengeId: parent.challengeId,
            gradeId: parent.gradeId,
            sectionId: parent.section.id,
          },
        });
        return data;
      },
    });
  }
}
