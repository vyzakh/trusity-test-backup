import { z } from 'zod';

export const UpdateTeacherSchema = z.object({
  teacherId: z.string().regex(/^\d+$/),
  name: z.string().min(1).max(100).optional(),
  contactNumber: z.string().optional().nullable(),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .transform((val) => val?.toLowerCase()),
  assignedClasses: z
    .array(
      z.object({
        gradeId: z.number(),
        sectionIds: z.array(z.number()).nonempty(),
      }),
    )
    .nonempty()
    .optional(),
});
