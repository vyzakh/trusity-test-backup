import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SaveMarketFitInput {
  @Field(() => String)
  businessId: string;

  @Field(() => Boolean)
  isReviewed: boolean;
}
