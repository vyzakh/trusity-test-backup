import { Field, ObjectType } from '@nestjs/graphql';
import { Business } from '../../business/types';

@ObjectType()
export class TopPerformedBusiness {
  @Field(() => Business)
  business: Business;

  @Field(() => Number)
  performanceScore: number;
}
