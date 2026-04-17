import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Currency {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  code: string;
}
