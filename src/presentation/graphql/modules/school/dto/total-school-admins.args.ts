import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export abstract class ToatalSchoolAdminsArgs {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;
}
