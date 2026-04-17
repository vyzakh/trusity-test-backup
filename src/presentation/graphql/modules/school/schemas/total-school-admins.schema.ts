import { z } from 'zod';

export const TotalSchoolAdminsSchema = z.object({
  name: z.string().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
});
