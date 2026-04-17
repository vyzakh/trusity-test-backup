import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateSchoolAdminInput {
  @Field(() => String, { nullable: true })
  schoolAdminId?: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}
