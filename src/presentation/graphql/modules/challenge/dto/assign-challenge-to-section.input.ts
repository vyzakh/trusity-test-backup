import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignChallengeToSchoolSectionInput {
  @Field(() => String)
  schoolSectionId: string;

  @Field(() => Boolean)
  isEntire: boolean;

  @Field(() => [String], { nullable: true })
  studentIds: string[];
}
