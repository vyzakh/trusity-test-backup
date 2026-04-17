import { z } from 'zod';

export const StudentSchema = z.object({
  studentId: z.string().regex(/^\d+$/),
});
