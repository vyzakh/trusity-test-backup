import { validateWordCount } from '@shared/utils/validate-wordcount.util';
import { z } from 'zod';

export const BusinessIdSchema = z.string().regex(/^\d+$/, 'Business ID must be numeric');

const HexColorSchema = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color');

const BrandVoiceSchema = validateWordCount(50, 250, 'Brand voice');

const CustomerExperienceSchema = validateWordCount(200, 250, 'Customer experience');

const BrandFontSchema = z.object({
  url: z.string().url('Invalid font URL'),
  name: z.string().min(1, 'Font name is required'),
});

export const GenerateBrandingSchema = z.object({
  businessId: BusinessIdSchema,
  brandVoice: BrandVoiceSchema,
});

const SaveBrandingDataSchema = z.object({
  brandVoice: BrandVoiceSchema,
  primaryColor: HexColorSchema,
  secondaryColor: HexColorSchema,
  tertiaryColor: HexColorSchema,
  selectedFont: BrandFontSchema,
});

export const SaveBrandingSchema = z.object({
  businessId: BusinessIdSchema,
  branding: SaveBrandingDataSchema,
  customerExperience: CustomerExperienceSchema,
});
