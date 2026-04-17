import { CreateBusinessModelUseCase } from '@application/use-cases/business/create-business-model.usecase';
import { ExportBusinessModelUseCase } from '@application/use-cases/business/export-business-model.use-case';
import { ICurrentStudentUser, ICurrentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { SaveBusinessModelSchema } from './schemas/business-model.schema';
import { SaveBusinessModelInput } from './types/business-model.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class BusinessModelResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.BUSINESS_MODEL)
  async saveBusinessModel(@Args('input') input: SaveBusinessModelInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = SaveBusinessModelSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new CreateBusinessModelUseCase({
          businessRepo,
          amqpConnection: this.amqpConnection,
        });

        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Successfully created business model',
      business: data,
    };
  }

  // @Mutation(() => BusinessResult)
  // @IsPrivate()
  // @Scopes(UserScope.STUDENT)
  // @BusinessPhaseStep(BusinessPhaseStepEnum.BUSINESS_MODEL)
  // async exportBusinessModel(@Args() input: ExportBusinessModelInput, user: ICurrentStudentUser) {
  //   const data = await this.dbService.runUnitOfWork({
  //     useTransaction: false,
  //     buildDependencies: async ({ db }) => ({
  //       businessRepo: new BusinessRepository(db),
  //     }),
  //     callback: async ({ businessRepo }) => {
  //       const useCase = new ExportBusinessModelUseCase({
  //         businessRepo,
  //         s3Service: this.s3Service,
  //       });

  //       return await useCase.execute({
  //         data: input,
  //         user: user,
  //       });
  //     },
  //   });

  //   return {
  //     message: 'Successfully exported business model pdf',
  //     business: data,
  //   };
  // }
}
