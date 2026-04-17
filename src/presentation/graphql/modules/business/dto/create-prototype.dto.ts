import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class GeneratePrototypeSuggestionsInput {
  @Field(() => String)
  businessId: String;

  @Field(() => Int)
  prototypeOptionId: number;

  @Field(() => String)
  description: String;
}

@InputType()
export class SavePrototypeInput {
  @Field(() => String)
  businessId: String;

  @Field(() => Int)
  prototypeOptionId: number;

  @Field(() => String)
  prototypeDescription: String;

  @Field(() => [String])
  prototypeImages: string[];
}
