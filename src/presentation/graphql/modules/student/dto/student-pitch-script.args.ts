import { ArgsType, Field, ID } from '@nestjs/graphql';

@ArgsType()
export class CreateStudentPitchScriptArgs {

  @Field(() => String)
  businessId: string;

  @Field(() => String, { nullable: true })
  narrative: string;

  @Field(() => String, { nullable: true })
  pitchDescription: string;

}

@ArgsType()
export class SaveStudentPitchScriptArgs {

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  narrative: string;

  @Field(() => String)
  pitchDescription: string;

  @Field(() => String)
  aiGeneratedScript: string;

}
