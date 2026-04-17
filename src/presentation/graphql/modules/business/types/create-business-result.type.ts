import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { Business } from './business.type';

@ObjectType()
export class CreateBusinessResult extends BaseResult {
  @Field(() => Business)
  business: Business;
}
