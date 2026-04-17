import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class MarketFitResult {
  @Field(() => Int)
  id: number;

  @Field(() => [String])
  feedback: string[];

  @Field(() => String)
  score: string;
}

@ObjectType()
export class SaveMarketFitResult extends BaseResult {}
