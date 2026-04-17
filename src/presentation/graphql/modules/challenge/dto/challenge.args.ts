import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ChallengeArgs {
  @Field(() => String)
  challengeId: string;
}
