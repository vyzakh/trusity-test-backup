import z from 'zod';

export const CreateSchoolAdminSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  name: z.string().min(1).max(100),
  email: z
    .string()
    .email()
    .max(255)
    .transform((val) => val.toLowerCase()),
  contactNumber: z.string().min(4).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});
