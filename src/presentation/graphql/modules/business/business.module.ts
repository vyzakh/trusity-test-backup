import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BusinessPhaseStepGuard } from '@presentation/graphql/gaurds/business-phase-step.guard';
import { BrandingResolver } from './branding.resolver';
import { BusinessFeedbackResolver } from './business-feedback.resolver';
import { BusinessLearningPhaseResolver, BusinessLearningResolver, BusinessLearningStepResolver } from './business-learning.resolver';
import { BusinessModelResolver } from './business-model.resolver';
import { BusinessResolver } from './business.resolver';
import { CapexResolver } from './capex.resolver';
import { FinancialPlanningResolver } from './financial-planning.resolver';
import { InvestmentResolver } from './investment.resolver';
import { LaunchResolver } from './launch.resolver';
import { marketFitResolver } from './market-fit.resolver';
import { marketResearchResolver } from './market-research.resolver';
import { MarketPlanResolver } from './marketing.resolver';
import { OpexResolver } from './opex.resolver';
import { prototypeResolver } from './prototype.resolver';
import { RevenueModelResolver } from './revenue-model.resolver';
import { BusinessLockResolver } from './business-lock.resolver';
import { EbidtaResolver } from './ebidta.resolver';

@Module({
  providers: [
    BusinessLearningResolver,
    BusinessLearningPhaseResolver,
    BusinessLearningStepResolver,
    BusinessResolver,
    marketFitResolver,
    prototypeResolver,
    BusinessModelResolver,
    RevenueModelResolver,
    CapexResolver,
    OpexResolver,
    EbidtaResolver,
    FinancialPlanningResolver,
    BrandingResolver,
    MarketPlanResolver,
    BusinessFeedbackResolver,
    marketResearchResolver,
    BusinessLockResolver,
    {
      provide: APP_GUARD,
      useClass: BusinessPhaseStepGuard,
    },
    InvestmentResolver,
    LaunchResolver,
  ],
})
export class BusinessModule {}
