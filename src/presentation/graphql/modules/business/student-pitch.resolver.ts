import {
  CreateStudentPitchPracticeAndFeedbackUseCase,
  CreateStudentPitchScriptUseCase,
  GeneratePitchDeckPPTXUseCase,
  SaveStudentPitchPracticeAndFeedbackUseCase,
  SaveStudentPitchScriptUseCase,
} from '@application/use-cases';
import { ExportPitchDeckUseCase } from '@application/use-cases/business/export-pitch-deck-pdf.use-case';
import { GeneratePitchDec1PPTXUseCase } from '@application/use-cases/business/generate-pitch-deck-pptx1.use-case';
import { ListPitchDeckPPTXUseCase } from '@application/use-cases/business/list-pitch-deck-pptx.use-case';
import { ListPitchDeckTemplatesUseCase } from '@application/use-cases/business/list-pitch-deck-templates-use-case';
import { SaveStudentPitchDeckkUseCase } from '@application/use-cases/business/save-student-pitch-deck.use-case';
import { ICurrentStudentUser } from '@core/types';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { BusinessRepository, DatabaseService, PitchDeckTemplatesRepository, StudentPitchScriptRepository } from '@infrastructure/database';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate, Scopes } from '@shared/decorators';
import { BusinessPhaseStep } from '@shared/decorators/business-phase-step.decorator';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { ValidationException } from '@shared/execeptions';
import { formatZodErrors } from '@shared/utils';
import { CreateStudentPitchScriptArgs, SaveStudentPitchScriptArgs } from '../student/dto';
import { SaveStudentPitchDeckArgs } from '../student/dto/student-pitch-deck.args';
import { createPitchPracticeAndFeedbackArgs, SaveStudentFeedbackScriptArgs } from '../student/dto/student-pitch-feedback.args';
import { CreateStudentPitchScriptSchema, ExportPitchDeckSchema, SaveStudentPitchScriptSchema } from '../student/schemas';
import {
  ExportPitchDeckInput,
  ListPitchDeckTemplatesResponse,
  PitchDeckInputs,
  PitchDeckPDF,
  PitchDeckPPTX,
  SavePitchDeck,
  StudentPitchPracticeAndFeedbackResult,
  StudentPitchScripts,
  StudentPitchScriptsResult,
} from '../student/types';
import { GeneratePitchDeckArgs } from './dto/generate-pitch-deck.args';
import { SaveStudentPitchDeckSchema } from './schemas/save-student-pitch-deck.schema';
import { CreateStudentFeedbackSchema, SaveStudentFeedbackSchema } from './schemas/student-pitch-feedback.schema';
@Resolver(() => StudentPitchScripts)
export class StudentPitchResolver {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly amqpConnection: AmqpConnection,
    private readonly s3Service: S3Service,
  ) {}

  @Mutation(() => StudentPitchScriptsResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PITCH_SCRIPT)
  async createPitchScriptDetails(@Args() args: CreateStudentPitchScriptArgs, @CurrentUser() user: ICurrentStudentUser): Promise<StudentPitchScriptsResult> {
    return this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        studentPitchScriptRepo: new StudentPitchScriptRepository(db),
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = CreateStudentPitchScriptSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new CreateStudentPitchScriptUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        const result = await useCase.execute(
          {
            businessId: args.businessId,
            narrative: args.narrative,
            pitchDescription: args.pitchDescription,
          },
          user,
        );

        return {
          success: true,
          message: 'Successfully created pitch script details',
          StudentPitchScripts: result,
          statusCode: 200,
        };
      },
    });
  }

  @Mutation(() => StudentPitchScriptsResult)
  //  @BusinessPhaseStep(BusinessPhaseStepEnum.PITCH_DECK)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async savePitchScriptDetails(@Args() args: SaveStudentPitchScriptArgs): Promise<StudentPitchScriptsResult> {
    return this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = SaveStudentPitchScriptSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new SaveStudentPitchScriptUseCase({
          businessRepo,
        });

        const result = await useCase.execute({
          businessId: args.businessId,
          narrative: args.narrative,
          pitchDescription: args.pitchDescription,
          aiGeneratedScript: args.aiGeneratedScript,
        });

        return {
          success: true,
          message: 'Successfully saved pitch script details',
          StudentPitchScripts: result,
          statusCode: 200,
        };
      },
    });
  }

  @Mutation(() => StudentPitchPracticeAndFeedbackResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PITCH_FEEDBACK)
  async createPitchPracticeAndFeedback(@Args() args: createPitchPracticeAndFeedbackArgs, @CurrentUser() user: ICurrentStudentUser): Promise<StudentPitchPracticeAndFeedbackResult> {
    return this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = CreateStudentFeedbackSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new CreateStudentPitchPracticeAndFeedbackUseCase({
          amqpConnection: this.amqpConnection,
          businessRepo,
        });

        const result = await useCase.execute({
          businessId: args.businessId,
          videoUrl: args.videoUrl,
          user,
        });

        return {
          success: true,
          message: 'Successfully create pitch feedback details',
          StudentPitchScripts: result,
          statusCode: 200,
        };
      },
    });
  }

  @Mutation(() => StudentPitchPracticeAndFeedbackResult)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async savePitchFeedbackDetails(@Args() args: SaveStudentFeedbackScriptArgs): Promise<any> {
    return this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = SaveStudentFeedbackSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new SaveStudentPitchPracticeAndFeedbackUseCase({
          businessRepo,
        });

        const result = await useCase.execute({
          businessId: args.businessId,
          videoUrl: args.videoUrl,
          aiGeneratedFeedback: args.aiGeneratedFeedback,
          score: args.score,
        });

        return {
          success: true,
          message: 'Successfully saved pitch feedback details',
          StudentPitchScripts: result,
          statusCode: 200,
        };
      },
    });
  }

  @Query(() => PitchDeckPDF)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async exportPitchDeckPdf(@Args() input: ExportPitchDeckInput) {
    const validation = ExportPitchDeckSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
    }
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new ExportPitchDeckUseCase({
          businessRepo,
        });

        return await useCase.execute({
          data: validation.data,
        });
      },
    });

    return {
      message: 'Successfully exported pitch deck pdf',
      pitchDeckPDF: data,
    };
  }

  @Query(() => PitchDeckPPTX)
  async listGeneratedPitchDeckPptx() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new ListPitchDeckPPTXUseCase();

        return await useCase.execute();
      },
    });

    return {
      message: 'Successfully generated pitch deck pptx',
      pitchDeckPPTX: data,
    };
  }

  // dynamic data and single pptx template for testing purpose
  @Mutation(() => PitchDeckPPTX)
  @BusinessPhaseStep(BusinessPhaseStepEnum.PITCH_DECK)
  async generatePitchDeck(@Args('data') data: PitchDeckInputs, @Args('templateId') templateId: number) {
    const result = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GeneratePitchDec1PPTXUseCase({
          businessRepo,
        });

        return await useCase.execute({
          businessId: data.businessId,
          templateId,
        });
      },
    });

    return {
      message: 'PPTX generated successfully',
      base64: result.base64,
      fileName: result.fileName,
      filePath: result.filePath,
    };
  }

  @Mutation(() => PitchDeckPPTX)
  async generatePitchDeckPptxTemplate(@Args('input') input: PitchDeckInputs, @Args('templateId') templateId: number) {
    const result = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const useCase = new GeneratePitchDec1PPTXUseCase({
          businessRepo,
        });

        return await useCase.execute({
          businessId: input.businessId,
          templateId,
        });
      },
    });
    return {
      message: 'PPTX generated successfully',
      base64: result.base64,
      fileName: result.fileName,
      filePath: result.filePath,
    };
  }

  @Mutation(() => PitchDeckPPTX)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async generatePitchDeckPptxTemplates(@Args() args: GeneratePitchDeckArgs, @CurrentUser() user: ICurrentStudentUser) {
    const result = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        s3Service: this.s3Service,
      }),
      callback: async ({ businessRepo, s3Service }) => {
        const useCase = new GeneratePitchDeckPPTXUseCase({ businessRepo, s3Service });
        const result = await useCase.execute(args.businessId, args.fileType, args.templateCode, user);
        return result;
      },
    });

    return {
      message: 'Pitch deck successfully generated',
      fileUrl: result,
    };
  }

  @Query(() => ListPitchDeckTemplatesResponse)
  async listPitchDeckTemplates() {
    const data = await this.dbService.runUnitOfWork({
      useTransaction: false,
      buildDependencies: async ({ db }) => ({
        pitchDeckRepo: new PitchDeckTemplatesRepository(db),
      }),
      callback: async ({ pitchDeckRepo }) => {
        const useCase = new ListPitchDeckTemplatesUseCase({ pitchDeckRepo });

        return await useCase.execute();
      },
    });
    return {
      message: 'Successfully fetched pitch deck templates',
      success: true,
      statusCode: 200,
      pitchDeckTemplates: data,
    };
  }

  // save pitch deck
  @Mutation(() => SavePitchDeck)
  @IsPrivate()
  @Scopes(UserScope.STUDENT)
  async savePitchDeck(@Args() args: SaveStudentPitchDeckArgs): Promise<any> {
    return this.dbService.runUnitOfWork({
      useTransaction: true,
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
      }),
      callback: async ({ businessRepo }) => {
        const validation = SaveStudentPitchDeckSchema.safeParse(args);

        if (!validation.success) {
          throw new ValidationException(validation.error.message, formatZodErrors(validation.error.errors));
        }

        const useCase = new SaveStudentPitchDeckkUseCase({
          businessRepo,
        });

        const result = await useCase.execute({
          businessId: args.businessId,
          callToAction: args.callToAction,
        });

        return {
          success: true,
          message: 'Successfully saved pitch deck details',
          data: result,
          statusCode: 200,
        };
      },
    });
  }
}
