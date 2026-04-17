import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UpdateSchoolGradeInput {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int)
  gradeId: number;

  @Field(() => [Int])
  sectionIds: number[];
}
