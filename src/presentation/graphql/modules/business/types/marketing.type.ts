import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@InputType()
export class GenerateMarketPlanInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  marketing: string;

  @Field(() => String)
  competitorAnalysis: string;
}

@InputType()
export class SaveMarketPlanInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  marketing: string;

  @Field(() => String)
  competitorAnalysis: string;

  @Field(() => String)
  marketingFeedback: string;

  @Field(() => Float)
  score: number;
}

@ObjectType()
export class GenerateMarketPlanResponse extends BaseResult {
  @Field(() => Float, { nullable: true })
  score?: number;

  @Field(() => String, { nullable: true })
  feedback?: string;
}
