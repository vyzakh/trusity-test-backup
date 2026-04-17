import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateRevenueModelInput {
  @Field(() => String)
  description: string;

  @Field(() => Int)
  currencyId: number;

  @Field(() => Int)
  businessId: number;

  @Field(() => Float)
  averageCostPerCustomerPerMonth: number;
}
