import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UnAssignChallengeInput {
  @Field()
  challengeId: string;

  @Field({ nullable: true })
  schoolId?: string;

  @Field({ nullable: true })
  schoolGradeId?: string;

  @Field(() => [String], { nullable: true })
  schoolSectionIds?: string[];

  @Field(() => [String], { nullable: true })
  studentIds?: string[];
}
