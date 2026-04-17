import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class SaveStudentPitchDeckArgs {

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  callToAction: string;

}