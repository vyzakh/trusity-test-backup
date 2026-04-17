import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UpdateChallengeAssignmentArgs {
  @Field(() => String)
  challengeId: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => Boolean)
  isEntire: boolean;

  @Field(() => [String], { nullable: true })
  gradeIds?: string[];
}
