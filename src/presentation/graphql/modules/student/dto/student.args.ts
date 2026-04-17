import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class StudentArgs {
  @Field(() => String)
  studentId: string;
}
