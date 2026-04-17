import { GenerateBrandingUseCase } from '@application/use-cases/business/generate-branding.usecase';
import { SaveBrandingUseCase } from '@application/use-cases/business/save-branding-usecase';
import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BusinessRepository, DatabaseService } from '@infrastructure/database';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { GenerateBrandingSchema, SaveBrandingSchema } from './schemas/branding.schema';
import { GenerateBrandingInput, GenerateBrandingResponse, SaveBrandingInput } from './types/branding.type';
import { BusinessResult } from './types/problem-statement.type';

@Resolver()
export class BrandingResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @Mutation(() => GenerateBrandingResponse)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.BRANDING)
  async generateBranding(@Args('input') input: GenerateBrandingInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = GenerateBrandingSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GenerateBrandingUseCase({
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
      message: 'Fonts generated successfully',
      suggestedFonts: data,
    };
  }

  @Mutation(() => BusinessResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.BRANDING)
  async saveBranding(@Args('input') input: SaveBrandingInput, @CurrentUser() user: ICurrentStudentUser) {
    const validation = SaveBrandingSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }

    const data = await this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new SaveBrandingUseCase({
          businessRepo,
        });
        return await useCase.execute({
          data: validation.data,
          user,
        });
      },
    });

    return {
      message: 'Branding saved successfully',
      business: data,
    };
  }
}
