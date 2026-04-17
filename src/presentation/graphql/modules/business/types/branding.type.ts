import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class BrandColor {
  @Field(() => String)
  backgroundColor: string;
}

@ObjectType()
export class BrandFont {
  @Field(() => String)
  url: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class Branding {
  @Field(() => String, { nullable: true })
  brandVoice?: string;

  @Field(() => String, { nullable: true })
  primaryColor?: string;

  @Field(() => String, { nullable: true })
  secondaryColor?: string;

  @Field(() => String, { nullable: true })
  tertiaryColor?: string;

  @Field(() => BrandFont, { nullable: true })
  selectedFont?: BrandFont;
}

@ObjectType()
export class GenerateBrandingResponse extends BaseResult {
  @Field(() => [BrandFont])
  suggestedFonts: BrandFont[];
}

@InputType()
export class BrandColorInput {
  @Field(() => String)
  backgroundColor: string;
}

@InputType()
export class BrandFontInput {
  @Field(() => String)
  url: string;

  @Field(() => String)
  name: string;
}

@InputType()
export class BrandingInput {
  @Field(() => String)
  brandVoice: string;

  @Field(() => String)
  primaryColor: String;

  @Field(() => String)
  secondaryColor: String;

  @Field(() => String)
  tertiaryColor: String;
}

@InputType()
export class GenerateBrandingInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  brandVoice: string;
}

@InputType()
export class SaveBrandingDataInput {
  @Field(() => String)
  brandVoice: string;

  @Field(() => String)
  primaryColor: string;

  @Field(() => String)
  secondaryColor: string;

  @Field(() => String)
  tertiaryColor: string;

  @Field(() => BrandFontInput)
  selectedFont: BrandFontInput;
}

@InputType()
export class SaveBrandingInput {
  @Field(() => String)
  businessId: string;

  @Field(() => SaveBrandingDataInput)
  branding: SaveBrandingDataInput;

  @Field(() => String)
  customerExperience: string;
}
