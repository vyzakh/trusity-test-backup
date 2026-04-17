import { Field, InputType } from '@nestjs/graphql';

@InputType()
class InvestmentValueEdgeInput {
  @Field(() => String)
  fundCase: string;
}

@InputType()
class InvestmentFundSourceInput {
  @Field(() => String)
  source: string;
}

@InputType()
class InvestmentNextStepInput {
  @Field(() => String)
  actionItem: string;

  @Field(() => String)
  step: string;

  @Field(() => String)
  due: string;
}

@InputType()
class InvestmentFundPitchStatementInput {
  @Field(() => String)
  pitchStatement: string;
}

@InputType()
class InvestmentFundGoalInput {
  @Field()
  goal: string;

  @Field()
  cost: string;

  @Field()
  outcome: string;
}

@InputType()
export class InvestmentFundPlanInput {
  @Field()
  amount: string;

  @Field()
  description: string;

  @Field()
  importance: string;
}

@InputType()
export class CreateInvestmentInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  amount: string;

  @Field(() => String)
  purpose: string;

  @Field(() => InvestmentValueEdgeInput)
  valueEdge: InvestmentValueEdgeInput;

  @Field(() => [InvestmentFundGoalInput])
  fundGoals: InvestmentFundGoalInput[];

  @Field(() => [InvestmentFundPlanInput])
  fundPlan: InvestmentFundPlanInput[];

  @Field(() => InvestmentFundSourceInput)
  fundSource: InvestmentFundPlanInput;

  @Field(() => [InvestmentNextStepInput])
  nextStep: InvestmentNextStepInput[];

  @Field(() => InvestmentFundPitchStatementInput)
  fundPitchStatement: InvestmentFundPitchStatementInput;
}
