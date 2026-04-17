import { ArgsType, Field } from '@nestjs/graphql';
import { PaginationArgs } from '@presentation/graphql/shared/args';

@ArgsType()
export class TeacherArgs {
  @Field(() => String)
  teacherId: string;
}

@ArgsType()
export class TeachersArgs extends PaginationArgs {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;
}

@ArgsType()
export abstract class ToatalTeachersArgs {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;
}
