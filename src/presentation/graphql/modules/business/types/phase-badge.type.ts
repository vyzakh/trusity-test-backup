import { Field, ObjectType } from '@nestjs/graphql';
import { Badge } from '../../badge/types/badge.type';

@ObjectType()
export class BusinessPhaseBadge {
  @Field()
  phaseKey: string;

  @Field()
  phaseName: string;

  @Field(() => Badge, { nullable: true })
  badge: Badge;
}
