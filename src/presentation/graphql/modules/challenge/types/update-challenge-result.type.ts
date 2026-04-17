import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types/base-result.type';
import { Challenge } from './challenge.type';

@ObjectType()
export class UpdateChallengeResult extends BaseResult {
  @Field(() => Challenge, { nullable: true })
  challenge: Challenge;
}
