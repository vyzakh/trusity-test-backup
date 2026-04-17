import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UnassignChallengeArgs {
  @Field(() => String)
  challengeId: string;

  @Field(() => String)
  schoolId: string;
}
