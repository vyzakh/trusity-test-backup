import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class GenerateProblemStatementFeedbackInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  problemStatement: string;
}

@InputType()
export class SaveProblemStatementInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  problemStatement: string;
}

@InputType()
export class GenerateMarketResearchDataInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  targetMarket: string;

  @Field(() => String)
  marketResearch: string;
}

@InputType()
export class GenerateMarketResearchQuestionsInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  targetMarket: string;

  @Field(() => String)
  marketResearch: string;
}

@InputType()
export class MarketResearchQuestion {
  @Field(() => Int)
  slNo: number;

  @Field()
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

@InputType()
export class GenerateMarketResearchScoreInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  marketResearch: string;

  @Field(() => String)
  marketResearchData: string;

  @Field(() => String)
  targetMarket: string;

  @Field(() => String)
  competitors: string;

  @Field(() => [MarketResearchQuestion])
  questions: MarketResearchQuestion[];

  @Field(() => String)
  summary: string;
}
