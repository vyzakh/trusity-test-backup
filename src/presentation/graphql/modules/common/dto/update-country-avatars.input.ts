import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AvatarFieldsInput {
  @Field(() => String, { nullable: true })
  head_url?: string;

  @Field(() => String, { nullable: true })
  full_scale_url?: string;

  @Field(() => String, { nullable: true })
  hand_wave_url?: string;
}

@InputType()
export class UpdateCountryAvatarsInput {
  @Field(() => String)
  countryId: string;

  @Field(() => AvatarFieldsInput, { nullable: true })
  group1?: AvatarFieldsInput;

  @Field(() => AvatarFieldsInput, { nullable: true })
  group2?: AvatarFieldsInput;

  @Field(() => AvatarFieldsInput, { nullable: true })
  group3?: AvatarFieldsInput;

  @Field(() => AvatarFieldsInput, { nullable: true })
  group4?: AvatarFieldsInput;

  @Field(() => Boolean)
  isFallbackDefault: boolean;
}
