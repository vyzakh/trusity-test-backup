import { ResetPasswordWithTokenUseCase } from '@application/use-cases/auth/reset-password-with-token.use-case';
import { SendPasswordResetLinkUseCase } from '@application/use-cases/auth/send-password-reset-link.use-case';
import { DeleteNotification } from '@application/use-cases/challenge/delete-notifications.use-case';
import { GetNotificationCountUseCase } from '@application/use-cases/challenge/get-notification-count.use-case';
import { GetNotificationsUseCase } from '@application/use-cases/challenge/get-notification.use-case';
import { UpdateReadNotifications } from '@application/use-cases/challenge/update-readed-notifications.use-case';
import { DatabaseService, UserAccountRepository } from '@infrastructure/database';
import { NotificationRepository } from '@infrastructure/database/repositories/notification.repository';
import { EmailService } from '@infrastructure/email';
import { GqlLocalAuthGuard } from '@infrastructure/passport/guards/gql-local-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { IsPrivate, IsPublic } from '@shared/decorators';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { Request } from 'express';
import { ICurrentStudentUser, ICurrentUser } from 'src/core/types';
import { deleteNotificationsSchema, GetNotificationsSchema, UpdateReadNotificationsSchema } from '../business/schemas/notification.schema';
import { LoginArgs } from './dto';
import { DeleteNotificationInput, LoginResult, NotificationCount, NotificationInput, ResetPasswordWithTokenInput, SendPasswordResetLinkInput } from './types';
import { Notification, ReadNotificationsInput } from './types/notification.type';

@Resolver(() => LoginResult)
export class AuthResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  @Mutation(() => LoginResult)
  @IsPublic()
  @UseGuards(GqlLocalAuthGuard)
  async login(@Args() _: LoginArgs, @CurrentUser() user: ICurrentUser) {
    return {
      message: 'You’ve successfully signed in.',
      user,
    };
  }

  @Query(() => LoginResult)
  @IsPrivate()
  async whoami(@CurrentUser() user: ICurrentUser) {
    return { user };
  }

  @Mutation(() => BaseResult)
  async logout(@Context() context: { req: Request }) {
    const { req } = context;
    req.session.destroy(() => {});

    return {
      message: 'You’ve successfully signed out.',
    };
  }

  @Mutation(() => BaseResult)
  async sendPasswordResetLink(@Args('input') input: SendPasswordResetLinkInput) {
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ userAccountRepo }) => {
        const useCase = new SendPasswordResetLinkUseCase({
          emailService: this.emailService,
          userAccountRepo,
        });
        await useCase.execute({
          data: { email: input.email },
        });
      },
    });

    return {
      message: 'A password reset link has been sent to your email address.',
    };
  }

  @Mutation(() => BaseResult)
  async resetPasswordWithToken(@Args('input') input: ResetPasswordWithTokenInput) {
    await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        userAccountRepo: new UserAccountRepository(db),
      }),
      callback: async ({ userAccountRepo }) => {
        const useCase = new ResetPasswordWithTokenUseCase({
          userAccountRepo,
        });

        await useCase.execute({
          data: { token: input.token, password: input.password },
        });
      },
    });

    return {
      message: 'Your password has been successfully reset.',
    };
  }

  @ResolveField(() => String, { nullable: true })
  sessionId(@Context() context: { req: Request }) {
    return context.req.sessionID;
  }

  @ResolveField(() => [Notification])
  @IsPrivate()
  async notifications(@CurrentUser() user: ICurrentUser, @Args('input') input: NotificationInput) {
    const validation = GetNotificationsSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        notificationRepo: new NotificationRepository(db),
      }),
      callback: async ({ notificationRepo }) => {
        const useCase = new GetNotificationsUseCase({ notificationRepo });
        return useCase.execute({
          user,
          pagination: validation.data,
        });
      },
    });

    return data;
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  async updateReadNotifications(@CurrentUser() user: ICurrentUser, @Args() args: ReadNotificationsInput) {
    const validation = UpdateReadNotificationsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        notificationRepo: new NotificationRepository(db),
      }),
      callback: async ({ notificationRepo }) => {
        const useCase = new UpdateReadNotifications({ notificationRepo });
        return useCase.execute({
          user,
          ...validation.data,
        });
      },
    });
    return {
      message: data ? 'no notifications exists with the given ID' : 'read notification updated sucessfully',
    };
  }

  @Query(() => NotificationCount)
  @IsPrivate()
  async notificationCount(@CurrentUser() user: ICurrentStudentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        notificationRepo: new NotificationRepository(db),
      }),
      callback: async ({ notificationRepo }) => {
        const useCase = new GetNotificationCountUseCase({ notificationRepo });
        return useCase.execute({
          user,
        });
      },
    });

    return data;
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  async deleteNotification(@CurrentUser() user: ICurrentStudentUser, @Args() args: DeleteNotificationInput) {
    const validation = deleteNotificationsSchema.safeParse(args);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        notificationRepo: new NotificationRepository(db),
      }),
      callback: async ({ notificationRepo }) => {
        const useCase = new DeleteNotification({ notificationRepo });
        return useCase.execute({
          user,
          ...validation.data,
        });
      },
    });
    return {
      message: 'notifications deleted sucessfully',
    };
  }
}
