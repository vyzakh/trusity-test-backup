import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class DeleteSchoolAdminArgs {
  @Field(() => String)
  schoolAdminId: string;
}
