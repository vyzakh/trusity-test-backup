import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class DeleteTeacherArgs {
  @Field(() => String)
  teacherId: string;
}
