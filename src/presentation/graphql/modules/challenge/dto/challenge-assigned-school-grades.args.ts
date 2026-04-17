import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class ChallengeAssignedSchoolGradesArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;
}
