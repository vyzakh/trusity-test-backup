import { ArgsType, Field, InputType } from '@nestjs/graphql';

@InputType()
class QuestionnaireInput {
  @Field(() => String)
  yes: string;

  @Field(() => String)
  no: string;

  @Field(() => String)
  yesPercentage: string;

  @Field(() => String)
  noPercentage: string;

  @Field(() => String, { nullable: false })
  title: string;
}

@ArgsType()
export class CreateMarketResearchArgs {
  @Field(() => String, { nullable: false })
  marketResearch: string;

  @Field(() => String, { nullable: false })
  targetMarket: string;

  @Field(() => String, { nullable: true })
  marketResearchData: string;

  @Field(() => String, { nullable: true })
  competitors: string;

  @Field(() => [QuestionnaireInput], { nullable: false })
  questionnaire: QuestionnaireInput[];

  @Field(() => String, { nullable: false })
  score: string;

  @Field(() => String, { nullable: false })
  summary: string;
}
