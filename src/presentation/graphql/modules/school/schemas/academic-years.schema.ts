import z from 'zod';

export const AcademicYearsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
  studentId: z.string().regex(/^\d+$/).optional(),
});
