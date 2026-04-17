import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Permission {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  code: string;

  @Field(() => String, { nullable: true })
  description: string;
}
