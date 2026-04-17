import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OverallSchoolPhaseScores {
  @Field(() => Number, { nullable: true })
  innovation: number;

  @Field(() => Number, { nullable: true })
  entrepreneurship: number;

  @Field(() => Number, { nullable: true })
  communication: number;
}
