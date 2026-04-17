import { z } from 'zod';

export const SaveLaunchSchema = z.object({
  businessId: z.string().regex(/^\d+$/, 'businessId must be a number'),
  launchStrategy: z.string().min(1, 'Launch strategy is required'),
});
