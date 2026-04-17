import { z } from 'zod';

export const GenerateMarketFitFeedbackSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  marketFit: z.string(),
});
