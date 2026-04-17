import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Badge {
  @Field(() => String)
  id: string;

  @Field(() => String)
  levelKey: string;

  @Field(() => String)
  displayName: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  iconUrl?: string;

  @Field(() => String, { nullable: true })
  iIconUrl?: string;

  @Field(() => String, { nullable: true })
  eIconUrl?: string;

  @Field(() => String, { nullable: true })
  cIconUrl?: string;

  @Field(() => Number)
  minPercentage: number;

  @Field(() => String, { nullable: true })
  backgroundColor?: string;

  @Field(() => Number)
  priority: number;

  @Field(() => String, { nullable: true })
  primaryColor?: string;
}

@ObjectType()
export class AchievedBadge {
  @Field(() => Badge, { nullable: true })
  badge: Badge;

  @Field(() => Number)
  badgeScore: number;
}
