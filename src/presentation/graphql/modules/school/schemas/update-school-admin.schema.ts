import { z } from 'zod';

export const UpdateSchoolAdminSchema = z.object({
  schoolAdminId: z.string().regex(/^\d+$/).optional(),
  name: z.string().min(1).max(100).optional(),
  contactNumber: z.string().min(4).max(20).nullable().optional(),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .transform((val) => val?.toLowerCase()),
});
