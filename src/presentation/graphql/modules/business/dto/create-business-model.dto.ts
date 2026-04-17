import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateBusinessModelCanvasInput {
  @Field(() => Int)
  questionId: number;

  @Field(() => String)
  answer: string;

  @Field(() => Int)
  businessId: number;
}
