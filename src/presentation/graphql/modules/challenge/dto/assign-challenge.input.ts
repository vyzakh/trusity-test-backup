import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AssignChallengeInput {
  @Field(() => String)
  challengeId: string;

  @Field(() => String)
  startAt: string;

  @Field(() => String)
  endAt: string;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int, { nullable: true })
  gradeId: number;

  @Field(() => [String], { nullable: true })
  studentIds: string[];
}
