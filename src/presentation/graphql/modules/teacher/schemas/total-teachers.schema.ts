import { z } from 'zod';

export const TotalTeachersSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
});
