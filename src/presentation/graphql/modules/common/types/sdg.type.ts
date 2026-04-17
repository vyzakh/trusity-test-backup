import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Sdg {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string;
}
