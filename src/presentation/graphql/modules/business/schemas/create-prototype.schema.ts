import { z } from 'zod';

export const GeneratePrototypeSuggestionsSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  prototypeOptionId: z.number(),
  description: z.string(),
});

export const SavePrototypeSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  prototypeOptionId: z.number().nonnegative(),
  prototypeImages: z.array(z.string()).min(1),
  prototypeDescription: z.string().min(1),
});
