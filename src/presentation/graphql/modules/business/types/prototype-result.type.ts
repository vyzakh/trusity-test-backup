import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class GeneratePrototypeSuggestionsResult extends BaseResult {
  @Field(() => [String], { nullable: true })
  prototypeImages: string[];
}

@ObjectType()
export class PrototypeOption {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
