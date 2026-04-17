import { z } from 'zod';

export const DeleteBusinessSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
});
