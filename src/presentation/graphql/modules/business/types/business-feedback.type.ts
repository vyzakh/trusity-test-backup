import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BusinessFeedback {
  @Field(() => String)
  feedbackId: string;

  @Field(() => String, { nullable: true })
  innovationFeedback?: string;

  @Field(() => String, { nullable: true })
  entrepreneurshipFeedback?: string;

  @Field(() => String, { nullable: true })
  communicationFeedback?: string;
}
