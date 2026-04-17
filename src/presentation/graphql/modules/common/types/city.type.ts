import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class City {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
