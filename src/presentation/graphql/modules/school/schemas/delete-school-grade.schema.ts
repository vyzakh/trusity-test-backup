import { z } from 'zod';

export const DeleteSchoolGradeSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).nullish(),
  gradeId: z.number().positive(),
});
