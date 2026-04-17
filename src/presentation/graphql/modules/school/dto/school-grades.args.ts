import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class SchoolGradesArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => [Int], { nullable: true })
  gradeIds?: number[];
}
