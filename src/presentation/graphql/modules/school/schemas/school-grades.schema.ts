import z from 'zod';

export const SchoolGradesSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
});
