import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class DeleteStudentArgs {
  @Field(() => String)
  studentId: string;
}
