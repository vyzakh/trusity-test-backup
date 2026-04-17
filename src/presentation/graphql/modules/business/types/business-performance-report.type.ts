import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class BusinessInnovationStageScore {
  @Field(() => Number)
  problemStatementScore: number;

  @Field(() => Number)
  marketResearchScore: number;

  @Field(() => Number)
  marketFitScore: number;

  @Field(() => Number)
  prototypeScore: number;
}
@ObjectType()
class BusinessEntrepreneurshipStageScore {
  @Field(() => Number)
  businessModelScore: number;

  @Field(() => Number)
  financialPlanningScore: number;

  @Field(() => Number)
  marketingScore: number;
}
@ObjectType()
class BusinessCommunicationStageScore {
  @Field(() => Number)
  pitchDeckScore: number;
}
@ObjectType()
class BusinessInvestmentReport {
  @Field(() => String)
  pitchStatement: string;
}
@ObjectType()
class BusinessLaunchReport {
  @Field(() => String)
  recommendation: string;
}

@ObjectType()
export class BusinessInnovationStageReport {
  @Field(() => BusinessInnovationStageScore)
  stages: BusinessInnovationStageScore;

  @Field(() => Number)
  averageScore: number;
}
@ObjectType()
export class BusinessEntrepreneurshipStageReport {
  @Field(() => BusinessEntrepreneurshipStageScore)
  stages: BusinessEntrepreneurshipStageScore;

  @Field(() => Number)
  averageScore: number;
}
@ObjectType()
export class BusinessCommunicationStageReport {
  @Field(() => BusinessCommunicationStageScore)
  stages: BusinessCommunicationStageScore;

  @Field(() => Number)
  averageScore: number;
}

@ObjectType()
export class BusinessPerformanceReport {
  @Field(() => Number)
  averageOverallScore: number;

  @Field(() => BusinessInnovationStageReport)
  innovation: BusinessInnovationStageReport;

  @Field(() => BusinessEntrepreneurshipStageReport)
  entrepreneurship: BusinessEntrepreneurshipStageReport;

  @Field(() => BusinessCommunicationStageReport)
  communication: BusinessCommunicationStageReport;

  @Field(() => BusinessInvestmentReport)
  investment: BusinessInvestmentReport;

  @Field(() => BusinessLaunchReport)
  launch: BusinessLaunchReport;
}
