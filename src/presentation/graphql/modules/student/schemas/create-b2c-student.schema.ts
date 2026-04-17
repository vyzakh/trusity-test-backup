import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const CreateB2CStudentSchema = z.object({
  schoolId: z.string().regex(/^\d+$/),
  accountType: z.literal(BusinessModelEnum.B2C),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).transform((val) => val.toLowerCase()),
  contactNumber: z.string().min(1),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }),
  guardian: z
    .object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(255).transform((val) => val.toLowerCase()),
      contactNumber: z.string().min(1),
    })
    .strict(),
  gradeId: z.number(),
  sectionId: z.number(),
  avatarUrl: z.string().url().optional(),
});
