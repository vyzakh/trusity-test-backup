import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class StudentFilterArgs {
  @Field(() => String, { nullable: true })
  academicYearId: string;
}
