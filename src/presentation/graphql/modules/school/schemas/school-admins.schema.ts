import { z } from 'zod';

export const SchoolAdminsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  name: z.string().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
});
