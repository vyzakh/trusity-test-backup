import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types/base-result.type';
import { Badge } from './badge.type';

@ObjectType()
export class UpdateBadgeResult extends BaseResult {
  @Field(() => [Badge], { nullable: true })
  badges: Badge[];
}
