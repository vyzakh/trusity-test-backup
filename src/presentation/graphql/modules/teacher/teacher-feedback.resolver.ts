import { GetTeacherUseCase } from '@application/use-cases';
import { CreateFeedbackUseCase } from '@application/use-cases/teacher/create-feedback.use-case';
import { DeleteFeedbackUseCase } from '@application/use-cases/teacher/delete-feedback.use-case';
import { DownloadPrototypeImageUseCase } from '@application/use-cases/teacher/download-prototype-image.use-case';
import { GetFeedbackUseCase } from '@application/use-cases/teacher/get-feedback.use-case';
import { GetFeedbacksUseCase } from '@application/use-cases/teacher/get-teacher-feeback.use-case';
import { UpdateFeedbackUseCase } from '@application/use-cases/teacher/update-feedback.use-case';
import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository, DatabaseService, TeacherRepository } from '@infrastructure/database';
import { EmailService } from '@infrastructure/email';
import { WSGateway } from '@infrastructure/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { UserScope } from '@shared/enums';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { CreateFeedbackInput, DeleteFeedbackArgs, FeedbackArg, FeedbacksArgs, UpdateFeedbackArgs } from './dto';
import { CreateFeedbackSchema, FeedbackSchema, FeedbacksSchema } from './schemas/create-feedback.schema';
import { DeleteFeedbackSchema } from './schemas/delete-feedback.schema';
import { UpdateFeedbackSchema } from './schemas/update-feedback.schema';
import { BusinessStepFeedback, CreateFeedbackResult, DownloadResult, Teacher, UpdateFeedbackResult } from './types';

@Resolver(() => BusinessStepFeedback)
export class TeacherFeedbackResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly ws: WSGateway,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
  ) {}

  @Mutation(() => CreateFeedbackResult)
  @IsPrivate()
  @Scopes(UserScope.TEACHER)
  async createFeedback(@Args('input') input: CreateFeedbackInput, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ teacherRepo, businessRepo }) => {
        const validation = CreateFeedbackSchema.safeParse(input);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new CreateFeedbackUseCase({
          logger: new Logger(CreateFeedbackUseCase.name),
          dbService: this.dbService,
          emailService:this.emailService,
          teacherRepo,
          businessRepo,
          ws: this.ws,
        });

        const feedbackData = await useCase.execute({
          data: validation.data,
          user,
        });
        return feedbackData;
      },
    });

    return {
      message: 'Successfully created feedback',
      feedback: data,
    };
  }

  @Mutation(() => UpdateFeedbackResult)
  @IsPrivate()
  @Scopes(UserScope.TEACHER)
  async updateFeedback(@Args('input') input: UpdateFeedbackArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ teacherRepo, businessRepo }) => {
        const validation = UpdateFeedbackSchema.safeParse(input);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new UpdateFeedbackUseCase({
          teacherRepo,
          businessRepo,
        });

        const feedbackData = await useCase.execute({
          data: validation.data,
          user,
        });

        return feedbackData;
      },
    });

    return {
      message: 'Successfully updated feedback',
      feedback: data,
    };
  }

  @Mutation(() => BaseResult)
  @IsPrivate()
  @Scopes(UserScope.TEACHER)
  async deleteFeedback(@Args('input') input: DeleteFeedbackArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const validation = DeleteFeedbackSchema.safeParse(input);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new DeleteFeedbackUseCase({
          teacherRepo,
        });

        const result = await useCase.execute({
          data: validation.data,
          user,
        });

        return result;
      },
    });

    return {
      message: 'Successfully deleted feedback',
    };
  }

  @Query(() => [BusinessStepFeedback])
  @IsPrivate()
  @Scopes(UserScope.PLATFORM_USER, UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT)
  async feedbacks(@Args() args: FeedbacksArgs, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const validation = FeedbacksSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }
        const useCase = new GetFeedbacksUseCase({ teacherRepo });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return data;
  }

  @Query(() => BusinessStepFeedback, { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.SCHOOL_ADMIN, UserScope.TEACHER, UserScope.STUDENT)
  async feedback(@Args() args: FeedbackArg, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const validation = FeedbackSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }
        const useCase = new GetFeedbackUseCase({ teacherRepo });

        const data = await useCase.execute({
          data: validation.data,
          user,
        });

        return data;
      },
    });

    return data;
  }

  @ResolveField(() => Teacher, { nullable: true })
  async teacher(@Parent() feedback: BusinessStepFeedback, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        teacherRepo: new TeacherRepository(db),
      }),
      callback: async ({ teacherRepo }) => {
        const useCase = new GetTeacherUseCase({ teacherRepo });

        const data = await useCase.execute({
          data: {
            teacherId: feedback.teacherId,
          },
          user,
        });

        return data;
      },
    });

    return data;
  }

  @Mutation(() => DownloadResult, { nullable: true })
  @IsPrivate()
  @Scopes(UserScope.STUDENT, UserScope.TEACHER, UserScope.PLATFORM_USER)
  async downloadPrototypeImage(@Args('fileKey') fileKey: string, @CurrentUser() user: ICurrentUser) {
    const data = await this.dbService.runUnitOfWork({
      buildDependencies: async () => ({
        s3Service: this.s3Service,
      }),
      callback: async ({ s3Service }) => {
        const useCase = new DownloadPrototypeImageUseCase({ s3Service });

        const result = await useCase.execute({
          data: { fileKey },
          user,
        });

        return result;
      },
    });

    return data;
  }
}
