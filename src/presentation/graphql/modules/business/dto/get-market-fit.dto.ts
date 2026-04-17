import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GenerateMarketFitFeedbackInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  marketFit: string;
}
