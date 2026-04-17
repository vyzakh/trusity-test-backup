import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class Country {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  emoji: string;
}

@ObjectType()
export class AvatarFields {
  @Field(() => String, { nullable: true })
  head_url?: string;

  @Field(() => String, { nullable: true })
  full_scale_url?: string;

  @Field(() => String, { nullable: true })
  hand_wave_url?: string;
}

@ObjectType()
export class FallbackAvatarFields {
  @Field(() => AvatarFields)
  group1: AvatarFields;

  @Field(() => AvatarFields)
  group2: AvatarFields;

  @Field(() => AvatarFields)
  group3: AvatarFields;

  @Field(() => AvatarFields)
  group4: AvatarFields;
}

@ObjectType()
export class CountryAvatars extends BaseResult {
  @Field(() => AvatarFields, { nullable: true })
  group1?: AvatarFields;

  @Field(() => AvatarFields, { nullable: true })
  group2?: AvatarFields;

  @Field(() => AvatarFields, { nullable: true })
  group3?: AvatarFields;

  @Field(() => AvatarFields, { nullable: true })
  group4?: AvatarFields;

  @Field(() => FallbackAvatarFields)
  fallback: FallbackAvatarFields;

  @Field(() => Boolean)
  isFallbackDefault: boolean;
}
