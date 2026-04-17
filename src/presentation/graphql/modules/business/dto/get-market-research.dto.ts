import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetMarketResearchArgs {
  @Field(() => String)
  targetMarket: string;

  @Field(() => String)
  marketResearch: string;
}
