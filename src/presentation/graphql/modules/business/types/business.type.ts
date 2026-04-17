import { ArgsType, Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { BusinessModelEnum, BusinessSource } from '@shared/enums';
import { BusinessStatus } from '@shared/enums/business-status.enum';
import { EnrollmentStatusEnum } from '@shared/enums/enrollment-status.enum';
import { Branding } from './branding.type';
import { CapexItem } from './capex.type';
import { FinancialData } from './financial-planning.type';
import { Opex } from './opex.type';
import { BusinessRevenueModel } from './revenue-model.type';
import { Ebidta } from './ebidta.type';

@ArgsType()
export class BusinessesArgs {
  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String, { nullable: true })
  studentId: string;

  @Field(() => String, { nullable: true })
  countryId: string;

  @Field(() => String, { nullable: true })
  academicYearId: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => BusinessStatus, { nullable: true })
  status: BusinessStatus;

  @Field(() => BusinessModelEnum, { nullable: true })
  accountType: BusinessModelEnum;

  @Field(() => BusinessSource, { nullable: true })
  source: BusinessSource;
}

@ArgsType()
export class TotalBusinessesArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String, { nullable: true })
  studentId: string;

  @Field(() => String, { nullable: true })
  businessName: string;

  @Field(() => BusinessStatus, { nullable: true })
  status: BusinessStatus;

  @Field(() => BusinessSource, { nullable: true })
  source?: BusinessSource;
}

@InputType()
export class UpdateBusinessInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String, { nullable: true })
  businessName: string;

  @Field(() => String, { nullable: true })
  idea: string;

  @Field(() => [Int], { nullable: true })
  sdgIds: number[];
}

@ObjectType()
export class BusinessMarketQuestionnaire {
  @Field(() => Int)
  slNo: number;

  @Field(() => String)
  question: string;

  @Field(() => Int)
  yesCount: number;

  @Field(() => Int)
  noCount: number;

  @Field(() => Float)
  yesPercentage: number;

  @Field(() => Float)
  noPercentage: number;
}

@ObjectType()
export class BusinessPrototypeOption {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class BusinessProgressScore {
  @Field(() => Float, { nullable: true })
  problemStatement: number;

  @Field(() => Float, { nullable: true })
  marketResearch: number;

  @Field(() => Float, { nullable: true })
  marketFit: number;

  @Field(() => Float, { nullable: true })
  prototype: number;

  @Field(() => Float, { nullable: true })
  financialProjections: number;

  @Field(() => Float, { nullable: true })
  marketing: number;

  @Field(() => Float, { nullable: true })
  businessModel: number;

  @Field(() => Float, { nullable: true })
  pitchFeedback: number;
}

@ObjectType()
export class BusinessProgressStatus {
  @Field(() => Boolean, { nullable: true })
  problemStatement?: boolean;

  @Field(() => Boolean, { nullable: true })
  marketResearch?: boolean;

  @Field(() => Boolean, { nullable: true })
  marketFit?: boolean;

  @Field(() => Boolean, { nullable: true })
  prototype?: boolean;

  @Field(() => Boolean, { nullable: true })
  businessModel?: boolean;

  @Field(() => Boolean, { nullable: true })
  revenueModel?: boolean;

  @Field(() => Boolean, { nullable: true })
  capex?: boolean;

  @Field(() => Boolean, { nullable: true })
  opex?: boolean;

  @Field(() => Boolean, { nullable: true })
  financialProjections?: boolean;

  @Field(() => Boolean, { nullable: true })
  ebitda?: boolean;

  @Field(() => Boolean, { nullable: true })
  branding?: boolean;

  @Field(() => Boolean, { nullable: true })
  marketing?: boolean;

  @Field(() => Boolean, { nullable: true })
  pitchDeck?: boolean;

  @Field(() => Boolean, { nullable: true })
  pitchScript?: boolean;

  @Field(() => Boolean, { nullable: true })
  pitchFeedback?: boolean;

  @Field(() => Boolean, { nullable: true })
  investment?: boolean;

  @Field(() => Boolean, { nullable: true })
  launch?: boolean;
}

@ObjectType()
export class BusinessPhaseStatuses {
  @Field(() => Boolean)
  innovationCompleted: boolean;

  @Field(() => Boolean)
  entrepreneurshipCompleted: boolean;

  @Field(() => Boolean)
  communicationCompleted: boolean;
}

@ObjectType()
export class BusinessModel {
  @Field(() => String)
  keyPartners: string;

  @Field(() => String)
  customerSegments: string;

  @Field(() => String)
  valuePropositions: string;

  @Field(() => String)
  channels: string;

  @Field(() => String)
  customerRelationships: string;

  @Field(() => String)
  revenueStreams: string;

  @Field(() => String)
  keyResources: string;

  @Field(() => String)
  keyActivities: string;

  @Field(() => String)
  costStructure: string;

  @Field(() => String)
  targetMarketSize: string;

  @Field(() => String)
  goalsAndKPIs: string;
}

@ObjectType()
class InvestmentFundSource {
  @Field(() => String)
  source: string;
}

@ObjectType()
class InvestmentNextStep {
  @Field(() => String)
  actionItem: string;

  @Field(() => String)
  step: string;

  @Field(() => String)
  due: string;
}

@ObjectType()
class InvestmentFundPitchStatement {
  @Field(() => String)
  pitchStatement: string;
}

@ObjectType()
class InvestmentValueEdge {
  @Field(() => String)
  fundCase: string;
}

@ObjectType()
class InvestmentFundGoal {
  @Field(() => String)
  goal: string;

  @Field(() => String)
  cost: string;

  @Field(() => String)
  outcome: string;
}

@ObjectType()
class InvestmentFundPlan {
  @Field(() => String)
  amount: string;

  @Field(() => String)
  description: string;

  @Field(() => String)
  importance: string;
}

@ObjectType()
export class CreateInvestmentResult {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  amount: string;

  @Field(() => String)
  purpose: string;

  @Field(() => InvestmentValueEdge)
  valueEdge: InvestmentValueEdge;

  @Field(() => [InvestmentFundGoal])
  fundGoals: InvestmentFundGoal[];

  @Field(() => [InvestmentFundPlan])
  fundPlan: InvestmentFundPlan[];

  @Field(() => InvestmentFundSource)
  fundSource: InvestmentFundSource;

  @Field(() => [InvestmentNextStep])
  nextStep: InvestmentNextStep[];

  @Field(() => InvestmentFundPitchStatement)
  fundPitchStatement: InvestmentFundPitchStatement;
}

@ArgsType()
export class AverageBusinessesScoresArgs {
  @Field(() => String, { nullable: true })
  countryId?: string;

  @Field(() => BusinessModelEnum, { nullable: true })
  accountType?: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  schoolId?: string;

  @Field(() => String, { nullable: true })
  academicYearId: string;

  @Field(() => EnrollmentStatusEnum, { nullable: true })
  enrollmentStatus: EnrollmentStatusEnum;
}

@ObjectType()
export class BusinessAverageScores {
  @Field(() => Float, { nullable: true })
  avgIScore: number;

  @Field(() => Float, { nullable: true })
  avgEScore: number;

  @Field(() => Float, { nullable: true })
  avgCScore: number;

  @Field(() => Float, { nullable: true })
  averageScore: number;
}

@ObjectType()
export class BusinessSteps {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => Int)
  phaseId: number;

  @Field(() => String, { nullable: true })
  code: string;
}

@ObjectType()
export class Business {
  @Field(() => String)
  id: string;

  @Field(() => BusinessSource)
  source: BusinessSource;

  @Field(() => String)
  businessName: string;

  @Field(() => String)
  idea: string;

  @Field(() => String, { nullable: true })
  problemStatement: string;

  @Field(() => String, { nullable: true })
  problemStatementFeedback: string;

  @Field(() => String, { nullable: true })
  targetMarket: string;

  @Field(() => String, { nullable: true })
  marketResearch: string;

  @Field(() => String, { nullable: true })
  marketResearchData: string;

  @Field(() => String, { nullable: true })
  marketCompetitors: string;

  @Field(() => String, { nullable: true })
  marketSummary: string;

  @Field(() => [BusinessMarketQuestionnaire], { nullable: true })
  marketQuestionnaire: BusinessMarketQuestionnaire[];

  @Field(() => String, { nullable: true })
  marketFit: string;

  @Field(() => String, { nullable: true })
  marketFitFeedback: string;

  @Field(() => Boolean)
  isIdeaReviewed: boolean;

  @Field(() => BusinessPrototypeOption, { nullable: true })
  prototypeOption: BusinessPrototypeOption;

  @Field(() => String, { nullable: true })
  prototypeDescription: string;

  @Field(() => [String], { nullable: true })
  prototypeImages: string[];

  @Field(() => BusinessModel, { nullable: true })
  businessModel: BusinessModel;

  @Field(() => BusinessRevenueModel, { nullable: true })
  revenueModel?: BusinessRevenueModel;

  @Field(() => [CapexItem], { nullable: true })
  capex: CapexItem[];

  @Field(() => Float, { nullable: true })
  capexTotal: number;

  @Field(() => [Opex], { nullable: true })
  opex: Opex[];

  @Field(() => [FinancialData], { nullable: true })
  sales: FinancialData[];

  @Field(() => [FinancialData], { nullable: true })
  breakeven: FinancialData[];

  @Field(() => String, { nullable: true })
  breakevenPoint: string;

  @Field(() => String, { nullable: true })
  financialProjectionsDescription: string;

  @Field(() => String, { nullable: true })
  risksAndMitigations: string;

  @Field(() => String, { nullable: true })
  futurePlans: string;

  @Field(() => [Ebidta], { nullable: true })
  ebidta: Ebidta[];

  @Field(() => Branding, { nullable: true })
  branding?: Branding;

  @Field(() => String, { nullable: true })
  customerExperience: string;

  @Field(() => String, { nullable: true })
  marketing?: string;

  @Field(() => String, { nullable: true })
  competitorAnalysis?: string;

  @Field(() => String)
  businessModelExport: string;

  @Field(() => String, { nullable: true })
  marketingFeedback?: string;

  @Field(() => String, { nullable: true })
  launchRecommendation: String;

  @Field(() => String, { nullable: true })
  launchStrategy: String;

  @Field(() => CreateInvestmentResult, { nullable: true })
  investment: CreateInvestmentResult;

  @Field(() => BusinessStatus)
  status: BusinessStatus;

  @Field(() => Boolean, { nullable: true })
  isCompleted: boolean;
  // @Field(() => BusinessAverageScores, { nullable: true })
  // businessAverageScores?: BusinessAverageScores;

  @Field(() => String, { nullable: true })
  callToAction: string;

  @Field(() => String, { nullable: true })
  pitchDescription: string;

  @Field(() => String, { nullable: true })
  pitchAiGeneratedScript: string;

  @Field(() => String, { nullable: true })
  pitchNarrative: string;

  @Field(() => String, { nullable: true })
  pitchPracticeVideoUrl: string;

  @Field(() => String, { nullable: true })
  pitchAiGeneratedFeedback: string;

  @Field(() => [BusinessSteps], { nullable: true })
  steps: BusinessSteps[];

  @Field(() => String)
  createdAt: String;

  @Field(() => String)
  updatedAt: String;

  @Field(() => String)
  studentId: string;

  @Field(() => String, { nullable: true })
  challengeId: string | null;

  @Field(() => String, { nullable: true })
  academicYearId: string;
}

@InputType()
export class BusinessIdeasInput {
  @Field(() => String)
  keywords: string;

  @Field(() => [Int])
  sdgIds: number[];
}

@ObjectType()
export class BusinessIdea {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  idea: string;
}

@ObjectType()
export class BusinessNextStep {
  @Field(() => String)
  phase: string;

  @Field(() => String)
  step: string;
}
@ObjectType()
export class DeleteBusinessResult extends BaseResult {}

@ObjectType()
export class ExportBusinessModelResult extends BaseResult {
  @Field(() => String, { nullable: true })
  file: string;
}

@ArgsType()
export class DeleteBusinessArgs {
  @Field(() => String)
  businessId: string;
}
@InputType()
export class ExportBusinessSummaryInput {
  @Field(() => String)
  businessId: string;
}
@ObjectType()
export class ExportBusinessSummaryResult extends BaseResult {
  @Field(() => String, { nullable: true })
  file: string;
}
