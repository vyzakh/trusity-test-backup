import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteFeedbackArgs {
  @Field(() => String)
  feedbackId: string;
}
