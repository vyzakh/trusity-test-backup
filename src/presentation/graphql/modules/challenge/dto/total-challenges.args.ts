import { ArgsType, Field } from '@nestjs/graphql';
import { ChallengeCreatorType, ChallengeScope } from '@shared/enums';

@ArgsType()
export class TotalChallengesArgs {
  @Field(() => ChallengeCreatorType, { nullable: true })
  creatorType: ChallengeCreatorType;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => ChallengeScope, { nullable: true })
  scope: ChallengeScope;

  @Field(() => String, { nullable: true })
  schoolId: string;
}
