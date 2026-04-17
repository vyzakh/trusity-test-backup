import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class CreateSchoolAdminArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}
