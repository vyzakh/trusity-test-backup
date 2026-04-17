import z from 'zod';

export const SaveMarketFitSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  isReviewed: z.boolean(),
});
