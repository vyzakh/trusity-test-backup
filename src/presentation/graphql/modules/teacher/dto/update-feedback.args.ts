import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateFeedbackArgs {
  @Field(() => String)
  id: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  feedback?: string;

  @Field(() => [String], { nullable: true })
  fileUrl?: string[];
}
