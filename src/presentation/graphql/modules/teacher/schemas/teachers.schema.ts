import { z } from 'zod';

export const TeachersSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  name: z.string().min(1).max(100).optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
});
