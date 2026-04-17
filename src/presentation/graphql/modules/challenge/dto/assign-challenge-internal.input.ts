import { Field, InputType } from '@nestjs/graphql';
import { AssignChallengeToSchoolSectionInput } from './assign-challenge-to-section.input';

@InputType()
export class AssignChallengeInternalInput {
  @Field(() => String)
  challengeId: string;

  @Field(() => String, { nullable: true })
  schoolGradeId: string;

  @Field(() => [AssignChallengeToSchoolSectionInput], { nullable: true })
  schoolSections: AssignChallengeToSchoolSectionInput[];
}
