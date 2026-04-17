import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EnrollmentStatus {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  code: string;
}
