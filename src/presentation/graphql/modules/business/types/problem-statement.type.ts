import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { Business } from './business.type';

@ObjectType()
export class MetadataResult {
  @Field(() => String)
  x_axis: string;

  @Field(() => String)
  y_axis: string;
}

@ObjectType()
export class ProblemStatement {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  statement: string;

  @Field(() => [String])
  feedback: string[];

  @Field(() => MetadataResult)
  metadata: MetadataResult;

  @Field(() => Float)
  score: number;
}

@ObjectType()
export class CreateProblemStatementResult extends BaseResult {
  @Field(() => ProblemStatement)
  problemStatement: ProblemStatement;
}

@ObjectType()
export class ProblemStatementFeedback {
  @Field(() => String)
  tips: string;
}
@ObjectType()
export class GenerProblemStatementFeedbackResult extends BaseResult {
  @Field(() => ProblemStatementFeedback)
  problemStatement: ProblemStatementFeedback;
}

@ObjectType()
export class MarketResearchData {
  @Field(() => String, { nullable: true })
  marketResearchData: string;

  @Field(() => String, { nullable: true })
  competitors: string;

  @Field(() => [String], { nullable: true })
  questions: string[];
}
@ObjectType()
export class GenerateMarketResearchDataResult extends BaseResult {
  @Field(() => Business, { nullable: true })
  business: Business;
}

@ObjectType()
export class BusinessResult extends BaseResult {
  @Field(() => Business, { nullable: true })
  business: Business;
}

@ObjectType()
export class GenerateMarketResearchScoreResult extends BaseResult {}
