import { z } from 'zod';

export const CreateStudentPitchScriptSchema = z
  .object({
    businessId: z.string().readonly(),
    narrative: z.string().optional(),
    pitchDescription: z.string().optional(),
  })
  .strict();

export const SaveStudentPitchScriptSchema = z
  .object({
    businessId: z.string().min(1, 'Business ID is required').readonly(),
    narrative: z.string().min(1, 'Narrative is required'),
    pitchDescription: z.string().min(1, 'Pitch description is required'),
    aiGeneratedScript: z.string().min(1, 'AI generated script is required'),
  })
  .strict();
export const ExportPitchDeckSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required').readonly(),
  callToAction: z.string().min(1, 'Call to action is required'),
});
