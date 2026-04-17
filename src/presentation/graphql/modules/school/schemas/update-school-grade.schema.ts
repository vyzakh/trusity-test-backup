import { z } from 'zod';

export const UpdateSchoolGradeSchema = z.object({
  schoolGradeId: z.string().regex(/^\d+$/),
  input: z.object({
    gradeId: z.number(),
    sectionIds: z.array(z.number()),
  }),
});
