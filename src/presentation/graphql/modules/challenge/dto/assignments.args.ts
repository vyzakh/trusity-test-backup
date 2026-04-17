import { ArgsType, Field, Int } from '@nestjs/graphql';
import { ChallengeParticipationEnum } from '@shared/enums';

@ArgsType()
export class AssignmentsArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int, { nullable: true })
  gradeId: number;

  @Field(() => Int, { nullable: true })
  sectionId: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => ChallengeParticipationEnum, { nullable: true })
  participation?: ChallengeParticipationEnum;
}

@ArgsType()
export class TotalAssignmentsArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int, { nullable: true })
  gradeId: number;

  @Field(() => Int, { nullable: true })
  sectionId: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => ChallengeParticipationEnum, { nullable: true })
  participation?: ChallengeParticipationEnum;
}
