import { z } from 'zod';

export const TeacherSchema = z.object({
  teacherId: z.string().regex(/^\d+$/),
});
