import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class ChallengeAssignedSchoolSectionsArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int)
  gradeId: number;
}
