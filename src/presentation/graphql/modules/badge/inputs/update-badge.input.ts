import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateBadgeInput {
  @Field(() => String, { nullable: false })
  levelKey: string;

  @Field(() => Number, { nullable: false })
  minPercentage: number;
}
