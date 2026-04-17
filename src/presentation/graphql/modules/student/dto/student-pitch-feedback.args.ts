import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class createPitchPracticeAndFeedbackArgs {

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  videoUrl: string;

}

@ArgsType()
export class SaveStudentFeedbackScriptArgs {

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  videoUrl: string

  @Field(() => String)
  aiGeneratedFeedback: string;

  @Field(() => Number)
  score: number;

}
