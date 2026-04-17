import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Resource {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;
}
