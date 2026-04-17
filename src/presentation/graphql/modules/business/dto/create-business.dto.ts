import { Field, InputType, Int } from '@nestjs/graphql';
import { BusinessSource } from '@shared/enums';

@InputType()
export class CreateBusinessInput {
  @Field(() => BusinessSource)
  source: BusinessSource;

  @Field(() => String)
  businessName: string;

  @Field(() => String)
  idea: string;

  @Field(() => String, { nullable: true })
  challengeId: string;

  @Field(() => [Int], { nullable: true })
  sdgIds: number[];
}
