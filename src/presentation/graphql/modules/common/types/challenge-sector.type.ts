import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChallengeSector {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string;
}
