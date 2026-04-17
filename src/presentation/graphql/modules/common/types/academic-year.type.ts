import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AcademicYear {
  @Field(() => String)
  id: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => Int)
  startYear: number;

  @Field(() => Int)
  endYear: number;

  @Field(() => GraphQLISODateTime)
  startDate: Date;

  @Field(() => GraphQLISODateTime)
  endDate: Date;
}
