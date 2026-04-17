import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ChallengeAssignmentArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String)
  challengeId: string;
}
