import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class DeleteChallengeArgs {
  @Field(() => String)
  challengeId: string;
}
