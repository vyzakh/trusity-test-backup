import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class SchoolAdminsArgs {
  @Field(() => Int, { nullable: true })
  offset: number;

  @Field(() => Int, { nullable: true })
  limit: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;
}

@ArgsType()
export class SchoolAdminArgs {
  @Field(() => String)
  schoolAdminId: string;
}
