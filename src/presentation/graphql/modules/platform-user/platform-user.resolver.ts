import {
  AssignPermissionsToPlatformUserUseCase,
  CreatePlatformUserUseCase,
  GetPlatformUsersUseCase,
  GetPlatformUserUseCase,
  TotalPlatformUsersUseCase,
} from '@application/use-cases';
import { DeletePlatformUserUseCase } from '@application/use-cases/platform-user/delete-platform-user.use-case';
import { GetPlatformUserPermissionsUseCase } from '@application/use-cases/platform-user/get-platform-user-permissions.use-case';
import { UpdatePlatformUserUseCase } from '@application/use-cases/platform-user/update-platform-user.use-case';
import { UpdateProfileUseCase } from '@application/use-cases/platform-user/update-profile.use-case';
import { ICurrentPlatformUser, ICurrentUser } from '@core/types';
import {
  DatabaseService,
  LookupRepository,
  PlatformUserRepository,
  SchoolAdminRepository,
  StudentRepository,
  TeacherRepository,
  UserAccountRepository,
} from '@infrastructure/database';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { Permission, PlatformUser } from '../common/types';
import { AssignPermissionsToPlatformUserInput, CreatePlatformUserInput } from './platform-user.dto';
import {
  AssignPermissionsToPlatformUserSchema,
  CreatePlatformUserSchema,
  PlatformUserSchema,
  PlatformUsersSchema,
  TotalPlatformUsersSchema,
  UpdateProfileSchema,
} from './platform-user.schema';
import {
  AssignPermissionsToPlatformUserResult,
  CreatePlatformUserResult,
  DeletePlatformUserInput,
  DeletePlatformUserResult,
  PlatformUserArgs,
  PlatformUsersArgs,
  TotalPlatformUsersArgs,
  UpdatePlatformUserInput,
  UpdatePlatformUserResult,
  UpdateProfileInput,
} from './platform-user.type';

@Resolver(() => PlatformUser)
export class PlatformUserResolver {
  constructor(
    private readonly emailService: EmailService,
    private readonly dbService: DatabaseService,
  ) {}

  @Mutation(() => CreatePlatformUserResult)
  async createPlatformUser(@Args('input') input: CreatePlatformUserInput) {
    const validation = CreatePlatformUserSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ platformUserRepo, userAccountRepo }) => {
        const useCase = new CreatePlatformUserUseCase({ emailService: this.emailService, platformUserRepo, userAccountRepo });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Successfully created user',
      platformUser: data,
    };
  }

  @Mutation(() => AssignPermissionsToPlatformUserResult)
  async assignPermissionsToPlatformUser(@Args('input') input: AssignPermissionsToPlatformUserInput) {
    const validation = AssignPermissionsToPlatformUserSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
        lookupRepo: new LookupRepository(db),
        sessionRepo: new SessionRepository(db),
      }),
      callback: async ({ platformUserRepo, lookupRepo, sessionRepo }) => {
        const useCase = new AssignPermissionsToPlatformUserUseCase({ platformUserRepo, lookupRepo, sessionRepo, emailService: this.emailService });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Successfully assigned permissions user',
    };
  }

  @Query(() => [PlatformUser])
  async platformUsers(@Args() args: PlatformUsersArgs) {
    const validation = PlatformUsersSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ platformUserRepo }) => {
        const useCase = new GetPlatformUsersUseCase({ platformUserRepo });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });
  }

  @Query(() => Int)
  async totalPlatformUsers(@Args() args: TotalPlatformUsersArgs) {
    const validation = TotalPlatformUsersSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ platformUserRepo }) => {
        const useCase = new TotalPlatformUsersUseCase({ platformUserRepo });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });
  }

  @Query(() => PlatformUser, { nullable: true })
  async platformUser(@Args() args: PlatformUserArgs, @CurrentUser() user: ICurrentPlatformUser) {
    const validation = PlatformUserSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ platformUserRepo }) => {
        const useCase = new GetPlatformUserUseCase({ platformUserRepo });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });
  }

  @Mutation(() => DeletePlatformUserResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async deletePlatformUser(@Args('input') input: DeletePlatformUserInput, @CurrentUser() user: ICurrentPlatformUser) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ platformUserRepo }) => {
        const useCase = new DeletePlatformUserUseCase({ platformUserRepo });

        await useCase.execute({
          data: { platformUserId: input.platformUserId },
          user,
        });
      },
    });

    return { message: 'Platform user deleted.' };
  }

  @Mutation(() => UpdatePlatformUserResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER)
  async updatePlatformUser(@Args('input') input: UpdatePlatformUserInput, @CurrentUser() user: ICurrentPlatformUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ platformUserRepo, userAccountRepo }) => {
        const useCase = new UpdatePlatformUserUseCase({
          platformUserRepo,
          userAccountRepo,
        });

        return await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated platform user',
      platformUser: data,
    };
  }

  @ResolveField(() => [Permission])
  async permissions(@Parent() platformUser: PlatformUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
      }),
      callback: async ({ platformUserRepo }) => {
        const useCase = new GetPlatformUserPermissionsUseCase({ platformUserRepo });

        return await useCase.execute({
          data: { platformUserId: platformUser.id },
        });
      },
    });
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT)
  async updateProfile(@Args('input') input: UpdateProfileInput, @CurrentUser() user: ICurrentUser) {
    const validation = UpdateProfileSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        platformUserRepo: new PlatformUserRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
        studentRepo: new StudentRepository(db),
        teacherRepo: new TeacherRepository(db),
        sessionRepo: new SessionRepository(db),
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ platformUserRepo, schoolAdminRepo, studentRepo, teacherRepo, sessionRepo, userAccountRepo }) => {
        const useCase = new UpdateProfileUseCase({ platformUserRepo, schoolAdminRepo, studentRepo, teacherRepo, sessionRepo, userAccountRepo });

        return await useCase.execute({
          data: input,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated profile',
      profile: data,
    };
  }
}
