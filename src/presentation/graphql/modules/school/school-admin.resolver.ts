import { CreateSchoolAdminUseCase, GetSchoolAdminsUseCase, GetSchoolUseCase } from '@application/use-cases';
import { DeleteSchoolAdminUseCase } from '@application/use-cases/school-admin/delete-school-admin.use-case';
import { GetSchoolAdminUseCase } from '@application/use-cases/school-admin/get-school-admin.use-case';
import { TotalSchoolAdminsUseCase } from '@application/use-cases/school-admin/total-school-admins-use-case';
import { UpdateSchoolAdminUseCase } from '@application/use-cases/school-admin/update-school-admin.use-case';
import { DatabaseService, SchoolAdminRepository, SchoolRepository, UserAccountRepository } from '@infrastructure/database';
import { SessionRepository } from '@infrastructure/database/repositories/session.repository';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { ICurrentPlatformUser, ICurrentSchoolAdminUser, ICurrentUser } from 'src/core/types';
import { SchoolAdmin } from '../common/types/school-admin-user.type';
import { CreateSchoolAdminArgs } from './dto/create-school-admin.args';
import { DeleteSchoolAdminArgs } from './dto/delete-school-admin.args';
import { SchoolAdminArgs, SchoolAdminsArgs } from './dto/school-admins.args';
import { ToatalSchoolAdminsArgs } from './dto/total-school-admins.args';
import { UpdateSchoolAdminInput } from './dto/update-school-admin.args';
import { CreateSchoolAdminSchema } from './schemas';
import { DeleteSchoolAdminSchema } from './schemas/delete-school-admin.schema';
import { SchoolAdminsSchema } from './schemas/school-admins.schema';
import { TotalSchoolAdminsSchema } from './schemas/total-school-admins.schema';
import { UpdateSchoolAdminSchema } from './schemas/update-school-admin.schema';
import { School } from './types';
import { CreateSchoolAdminResult, UpdateSchoolAdminResult } from './types/create-school-admin.result';

@Resolver(() => SchoolAdmin)
export class SchoolAdminResolver {
  constructor(
    private emailService: EmailService,
    private readonly ws: WSGateway,
    private readonly dbService: DatabaseService,
  ) {}

  @Mutation(() => CreateSchoolAdminResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async createSchoolAdmin(@Args() args: CreateSchoolAdminArgs, @CurrentUser() user: ICurrentPlatformUser | ICurrentSchoolAdminUser) {
    const validation = CreateSchoolAdminSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolAdminRepo, userAccountRepo }) => {
        const useCase = new CreateSchoolAdminUseCase({
          logger: new Logger(CreateSchoolAdminUseCase.name),
          dbService: this.dbService,
          schoolAdminRepo,
          userAccountRepo,
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
      message: 'Successfully created school admin',
      schoolAdmin: data,
    };
  }

  @Mutation(() => UpdateSchoolAdminResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async updateSchoolAdmin(@Args('input') input: UpdateSchoolAdminInput, @CurrentUser() user: ICurrentPlatformUser | ICurrentSchoolAdminUser) {
    const validation = UpdateSchoolAdminSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolAdminRepo: new SchoolAdminRepository(db),
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ schoolAdminRepo, userAccountRepo }) => {
        const useCase = new UpdateSchoolAdminUseCase({
          logger: new Logger(UpdateSchoolAdminUseCase.name),
          dbService: this.dbService,
          schoolAdminRepo,
          userAccountRepo,
          ws: this.ws,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully updated school admin',
      schoolAdmin: data,
    };
  }

  @Query(() => [SchoolAdmin], { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async schoolAdmins(@Args() args: SchoolAdminsArgs, @CurrentUser() user: ICurrentPlatformUser | ICurrentSchoolAdminUser) {
    const validation = SchoolAdminsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolAdminRepo }) => {
        const useCase = new GetSchoolAdminsUseCase({ schoolAdminRepo });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return data;
  }

  @Query(() => Int)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async totalSchoolAdmins(@Args() args: ToatalSchoolAdminsArgs, @CurrentUser() user: ICurrentUser) {
    const validation = TotalSchoolAdminsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => {
        return {
          schoolAdminRepo: new SchoolAdminRepository(db),
        };
      },
      callback: async ({ schoolAdminRepo }) => {
        const useCase = new TotalSchoolAdminsUseCase({ schoolAdminRepo });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return data;
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async deleteSchoolAdmin(@Args() args: DeleteSchoolAdminArgs, @CurrentUser() user: ICurrentPlatformUser | ICurrentSchoolAdminUser) {
    const validation = DeleteSchoolAdminSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        schoolAdminRepo: new SchoolAdminRepository(db),
        userAccountRepo: new UserAccountRepository(db),
        sessionRepo: new SessionRepository(db),
      }),
      callback: async ({ schoolAdminRepo, userAccountRepo, sessionRepo }) => {
        const useCase = new DeleteSchoolAdminUseCase({
          logger: new Logger(DeleteSchoolAdminUseCase.name),
          dbService: this.dbService,
          schoolAdminRepo,
          userAccountRepo,
          sessionRepo,
          ws: this.ws,
        });

        await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'School admin deleted.',
    };
  }

  @Query(() => SchoolAdmin, { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN)
  async schoolAdmin(@Args() args: SchoolAdminArgs, @CurrentUser() user: ICurrentPlatformUser | ICurrentSchoolAdminUser) {
    return await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        schoolAdminRepo: new SchoolAdminRepository(db),
      }),
      callback: async ({ schoolAdminRepo }) => {
        const useCase = new GetSchoolAdminUseCase({
          schoolAdminRepo,
        });

        return await useCase.execute({
          data: args,
          user,
        });
      },
    });
  }

  @ResolveField(() => School, { nullable: true })
  async school(@Parent() schoolAdmin: SchoolAdmin, @CurrentUser() user: ICurrentUser) {
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
            schoolId: schoolAdmin.schoolId,
          },
          user,
        });
      },
    });
  }
}
