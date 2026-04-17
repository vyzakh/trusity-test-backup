import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class DeleteSchoolGradeInput {
  @Field(() => Int)
  gradeId: number;

  @Field(() => String, { nullable: true })
  schoolId: string;
}

@InputType()
export class DeleteSchoolSectionInput {
  @Field(() => Int)
  gradeId: number;

  @Field(() => Int)
  sectionId: number;

  @Field(() => String, { nullable: true })
  schoolId: string;
}
