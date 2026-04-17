import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';

@InputType()
export class CreateFeedbackInput {
  @Field(() => BusinessPhaseStepEnum)
  businessStep: BusinessPhaseStepEnum;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  feedback: string;

  @Field(() => [String], { nullable: true })
  fileUrl: string[];
}

@ArgsType()
export class FeedbacksArgs {
  @Field(() => BusinessPhaseStepEnum, { nullable: true })
  businessStep?: BusinessPhaseStepEnum;

  @Field(() => String)
  businessId: String;
}
@ArgsType()
export class FeedbackArg {
  @Field(() => String)
  feedbackId: string;
}
