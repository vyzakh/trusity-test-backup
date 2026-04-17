import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class BusinessRevenueModel {
  @Field(() => Int, { nullable: true })
  currencyId: number;

  @Field(() => String, { nullable: true })
  currencyCode: string;

  @Field(() => String, { nullable: true })
  revenueModel: string;

  @Field(() => Float, { nullable: true })
  unitSalesPercentage: number;
}

@InputType()
export class CreateRevenueModelInput {
  @Field(() => String)
  businessId: string;

  @Field(() => Int)
  currencyId: number;

  @Field(() => String)
  revenueModel: string;

  @Field(() => Float)
  unitSalesPercentage: number;
}

@ObjectType()
export class CreateRevenueModelResult extends BaseResult {}
