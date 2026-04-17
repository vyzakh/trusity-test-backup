import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class State {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
