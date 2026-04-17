import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const UpdateB2CStudentSchema = z.object({
  studentId: z.string().regex(/^\d+$/),
  input: z.object({
    name: z.string().max(100).optional(),
    contactNumber: z.string().min(1).optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date < new Date();
      })
      .optional(),
    guardian: z
      .object({
        name: z.string().min(1).max(100).optional(),
        email: z
          .string()
          .email()
          .max(255)
          .optional()
          .transform((val) => val?.toLowerCase()),
        contactNumber: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
    grade: z.string().min(1).optional(),
    section: z.string().min(1).optional(),
  }),
  accountType: z.literal(BusinessModelEnum.B2C),
  schoolId: z.string().regex(/^\d+$/).optional(),
  name: z.string().min(1).optional(),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .transform((val) => val?.toLowerCase()),
  contactNumber: z.string().min(1).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    })
    .optional(),
  guardian: z
    .object({
      name: z.string().min(1).nullable().optional(),
      email: z.string().email().max(255).nullable().optional().transform((val) => val?.toLowerCase()),
      contactNumber: z.string().min(1).nullable().optional(),
    })
    .strict()
    .optional(),
  grade: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return num >= 5 && num <= 13;
    }),
  section: z
    .string()
    .regex(/^[A-Za-z]$/)
    .optional(),
});
