import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Curriculum {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  allowCustom: boolean;
}
