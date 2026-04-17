import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@InputType()
export class CapexItemInput {
  @Field(() => String)
  name: string;

  @Field(() => Float)
  cost: number;
}

@InputType()
export class CreateCapexInput {
  @Field(() => String)
  businessId: string;

  @Field(() => [CapexItemInput])
  capex: CapexItemInput[];
}

@ObjectType()
export class CapexItem {
  @Field(() => String)
  name: string;

  @Field(() => Float)
  cost: number;
}

@ObjectType()
export class CreateCapexResult extends BaseResult {}
