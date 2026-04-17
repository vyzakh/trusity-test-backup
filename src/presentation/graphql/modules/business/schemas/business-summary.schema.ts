import { z } from 'zod';

export const ExportBusinessSummarySchema = z.object({
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
});
