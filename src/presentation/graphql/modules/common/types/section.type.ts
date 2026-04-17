import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Section {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
