import { z } from 'zod';

export const CreateTeacherSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).nullish(),
  name: z.string().min(1).max(100),
  contactNumber: z.string().min(1),
  email: z
    .string()
    .email()
    .max(255)
    .transform((val) => val.toLowerCase()),
  assignedClasses: z
    .array(
      z.object({
        gradeId: z.number(),
        sectionIds: z.array(z.number()).nonempty(),
      }),
    )
    .nonempty(),
  avatarUrl: z.string().url().optional(),
});
