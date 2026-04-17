import { GetBusinessGradeUseCase } from '@application/use-cases/business/get-business-grade.use-case';
import { GetBusinessProgressScoreUseCase } from '@application/use-cases/business/get-business-progress-score.use-case';
import { GetBusinessProgressStatusUseCase } from '@application/use-cases/business/get-business-progress-status.use-case';
import { GetBusinessUseCase } from '@application/use-cases/business/get-business.use-case';
import { ICurrentStudentUser } from '@core/types';
import { BusinessRepository, DatabaseService, EnrollmentRepository } from '@infrastructure/database';
import { AppSettingsRepository } from '@infrastructure/database/repositories/app-settings.repository';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BUSINESS_PHASE_STEP_KEY } from '@shared/decorators/business-phase-step.decorator';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { BadRequestException, NotFoundException } from '@shared/execeptions';
import { getRequestFromContext } from '../shared/utils';

@Injectable()
export class BusinessPhaseStepGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly dbService: DatabaseService,
  ) {}

  private calculatePhaseAverage(scores: Record<string, number>): number | null {
    if (!scores) return null;

    const scoreValues = Object.values(scores).filter((score) => score !== null && score !== undefined) as number[];

    if (scoreValues.length === 0) return null;

    const sum = scoreValues.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scoreValues.length) * 100) / 100;
  }

  private hasIECAverage(innovationAverage: number | null, entrepreneurshipAverage: number | null, communityAverage: any): boolean {
    return (
      innovationAverage !== null &&
      innovationAverage !== undefined &&
      innovationAverage > 0 &&
      entrepreneurshipAverage !== null &&
      entrepreneurshipAverage !== undefined &&
      entrepreneurshipAverage > 0 &&
      communityAverage !== null &&
      communityAverage !== undefined &&
      communityAverage > 0
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const businessPhaseStep = this.reflector.get<BusinessPhaseStepEnum>(BUSINESS_PHASE_STEP_KEY, context.getHandler());
    if (!businessPhaseStep) {
      return true;
    }

    const { request, args } = getRequestFromContext(context);
    const { user } = request as { user: ICurrentStudentUser };

    if (!user) {
      throw new BadRequestException();
    }

    const businessId: string = args.input?.businessId || args.businessId;

    if (!businessId) {
      throw new BadRequestException('Business ID is required');
    }

    const [business, businessProgressStatus, businessProgressScores, iecThreshold] = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        businessRepo: new BusinessRepository(db),
        appSettingsRepo: new AppSettingsRepository(db),
      }),
      callback: async ({ businessRepo, appSettingsRepo }) => {
        const useCase1 = new GetBusinessUseCase({ businessRepo });
        const useCase2 = new GetBusinessProgressStatusUseCase({ businessRepo });
        const useCase3 = new GetBusinessProgressScoreUseCase({ businessRepo });

        return await Promise.all([
          useCase1.execute({ data: { businessId }, user }),
          useCase2.execute({ data: { businessId } }),
          useCase3.execute({ data: { businessId } }),
          appSettingsRepo.getIecThreshold(),
        ]);
      },
    });

    if (!business || !businessProgressStatus) {
      throw new NotFoundException('The requested business could not be found. Please verify the business ID and try again.');
    }

    const businessGrade = await this.dbService.runUnitOfWork({
      buildDependencies: async ({ db }) => ({
        enrollmentRepo: new EnrollmentRepository(db),
      }),
      callback: async ({ enrollmentRepo }) => {
        const useCase = new GetBusinessGradeUseCase({
          enrollmentRepo,
        });
        return await useCase.execute({
          data: {
            studentId: business.studentId,
            academicYearId: business.academicYearId,
          },
        });
      },
    });

    const innovationScores = {
      problemStatement: businessProgressScores?.problemStatement,
      marketResearch: businessProgressScores?.marketResearch,
      marketFit: businessProgressScores?.marketFit,
      prototype: businessProgressScores?.prototype,
      //marketing: businessProgressScores?.marketing,
    };

    const innovationStatus = {
      problemStatement: businessProgressStatus?.problemStatement,
      marketResearch: businessProgressStatus?.marketResearch,
      marketFit: businessProgressStatus?.marketFit,
      prototype: businessProgressStatus?.prototype,
    };
    const businessStatuses = {
      businessModel: businessProgressStatus?.businessModel,
      revenueModel: businessProgressStatus?.revenueModel,
      capex: businessProgressStatus?.capex,
      opex: businessProgressStatus?.opex,
      financialProjections: businessProgressStatus?.financialProjections,
      branding: businessProgressStatus?.branding,
      marketing: businessProgressStatus?.marketing,
    };

    const businessScores = {
      businessModel: businessProgressScores?.businessModel,
      financialPlanning: businessProgressScores?.financialProjections,
      marketing: businessProgressScores?.marketing,
    };

    const pitchStatuses = {
      pitchDeck: businessProgressStatus.pitchDeck,
      pitchScript: businessProgressStatus.pitchScript,
      pitchVideo: businessProgressStatus.pitchFeedback,
    };

    const innovationAverage = this.calculatePhaseAverage(innovationScores);
    const entrepreneurshipAverage = this.calculatePhaseAverage(businessScores);
    const communicationAverage = businessProgressScores?.pitchFeedback;
    const hasIECScore = this.hasIECAverage(innovationAverage, entrepreneurshipAverage, communicationAverage);

    switch (businessPhaseStep) {
      case BusinessPhaseStepEnum.PROBLEM_STATEMENT: {
        return true;
      }

      case BusinessPhaseStepEnum.MARKET_RESEARCH: {
        if (!businessProgressStatus.problemStatement) {
          throw new BadRequestException('Problem statement must be completed before accessing market research.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.MARKET_FIT: {
        const isMovingForward = business.isIdeaReviewed === true;

        if (isMovingForward) {
          if (!businessProgressStatus.marketResearch) {
            throw new BadRequestException('Please complete the Market Research section before moving forward to Market Fit.');
          }
          return true;
        }

        if (!businessProgressStatus.marketResearch) {
          throw new BadRequestException('Market Research must be completed before you can save and review Market Fit. Please complete the previous section first.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.PROTOTYPE: {
        if (!businessProgressStatus.marketFit) {
          throw new BadRequestException('Market fit must be completed before accessing prototype.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.BUSINESS_MODEL: {
        const allInnovationStatus = Object.values(innovationStatus).every((s) => s === true);
        const allInnovationScores = Object.values(innovationScores).every((s) => s !== null && s !== undefined && s > 0);

        if (!allInnovationStatus || !allInnovationScores) {
          throw new BadRequestException('Innovation phase must be fully completed (all steps and scores) before accessing business model.');
        }
        return true;
      }
      case BusinessPhaseStepEnum.REVENUE_MODEL: {
        if (!businessProgressStatus.businessModel) {
          throw new BadRequestException('Business model must be completed before accessing revenue model.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.CAPEX: {
        if (!businessProgressStatus.revenueModel) {
          throw new BadRequestException('Revenue model must be completed before accessing CAPEX.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.OPEX: {
        if (!businessProgressStatus.capex) {
          throw new BadRequestException('CAPEX must be completed before accessing OPEX.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.FINANCIAL_PROJECTIONS: {
        if (!businessProgressStatus.opex) {
          throw new BadRequestException('OPEX must be completed before accessing financial planning.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.EBITDA: {
        if (businessGrade?.id === 5 || businessGrade?.id === 7) {
          if (!businessProgressStatus.financialProjections) {
            throw new BadRequestException('Financial Projections must be completed before accessing Ebidta.');
          }
          return true;
        } else {
          return true;
        }
      }

      case BusinessPhaseStepEnum.BRANDING: {
        if (businessGrade?.id === 5 || businessGrade?.id === 7) {
          if (!businessProgressStatus.ebitda) {
            throw new BadRequestException('EBITDA must be completed before accessing branding.');
          }
          return true;
        } else {
          if (!businessProgressStatus.financialProjections) {
            throw new BadRequestException('Financial Projections must be completed before accessing branding.');
          }
          return true;
        }
      }

      case BusinessPhaseStepEnum.MARKETING: {
        if (!businessProgressStatus.branding) {
          throw new BadRequestException('Branding must be completed before accessing marketing.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.PITCH_DECK: {
        const allBusinessStatus = Object.values(businessStatuses).every((s) => s === true);
        const allBusinessScores = Object.values(businessScores).every((s) => s !== null && s !== undefined && s > 0);

        if (!allBusinessStatus || !allBusinessScores) {
          throw new BadRequestException('Entrepreneurship phase must be fully completed (all steps and scores) before accessing pitch deck.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.PITCH_SCRIPT: {
        if (!businessProgressStatus.pitchDeck) {
          throw new BadRequestException('Pitch deck must be completed before accessing pitch script.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.PITCH_FEEDBACK: {
        if (!businessProgressStatus.pitchScript) {
          throw new BadRequestException('Pitch script must be completed before accessing pitch feedback.');
        }
        return true;
      }

      case BusinessPhaseStepEnum.INVESTMENT: {
        const allPitchStatus = Object.values(pitchStatuses).every((s) => s === true);

        const pitchScore = communicationAverage;
        const hasPitchScore = pitchScore !== null && pitchScore !== undefined && pitchScore > 0;

        if (!allPitchStatus || !hasPitchScore) {
          throw new BadRequestException('Communication phase must be fully completed (all steps and scores) before accessing investment.');
        }
        if (innovationAverage === null || entrepreneurshipAverage === null || communicationAverage === null) {
          throw new BadRequestException('IEC scores are incomplete. Innovation, Entrepreneurship, and Community scores are required to proceed to investment.');
        }

        const ieAvg = Math.round(((innovationAverage + entrepreneurshipAverage) / 2) * 100) / 100;
        const communicationThreshold = 75;

        if (ieAvg < iecThreshold || communicationAverage < communicationThreshold) {
          throw new BadRequestException(`Cannot proceed to investment phase. Required conditions are not satisfied.`);
        }

        return true;
      }

      case BusinessPhaseStepEnum.LAUNCH: {
        if (!businessProgressStatus.investment) {
          throw new BadRequestException('investment phase must be completed before accessing launch.');
        }

        return true;
      }

      default: {
        throw new BadRequestException('Invalid business phase step encountered.');
      }
    }
  }
}
