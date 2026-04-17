import { z } from 'zod';

export const CreateSchoolGradeSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).nullish(),
  gradeId: z.number(),
  sectionIds: z.array(z.number()),
});
