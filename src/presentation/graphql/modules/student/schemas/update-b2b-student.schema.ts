import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const UpdateB2BStudentSchema = z.object({
  studentId: z.string().regex(/^\d+$/),
  input: z.object({
    name: z.string().min(1).max(100).optional(),
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
    schoolSectionId: z.string().regex(/^\d+$/).optional(),
  }),
  schoolId: z.string().regex(/^\d+$/).optional(),
  accountType: z.literal(BusinessModelEnum.B2B),
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
      name: z.string().min(1).optional(),
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
  schoolGradeId: z.string().regex(/^\d+$/).optional(),
  schoolSectionId: z.string().regex(/^\d+$/).optional(),
});

export const UpdateStudentSchema = z.object({
  studentId: z.string().regex(/^\d+$/),
  accountType: z.nativeEnum(BusinessModelEnum),
  schoolId: z.string().regex(/^\d+$/).optional(),
  name: z.string().min(1).max(100).optional(),
  email: z
    .string()
    .email()
    .max(255)
    .optional()
    .transform((val) => val?.toLowerCase()),
  contactNumber: z.string().min(1).nullish(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    })
    .nullish(),
  guardian: z
    .object({
      name: z.string().min(1).max(100).nullish(),
      email: z.string().email().max(255).nullish().transform((val) => val?.toLowerCase()),
      contactNumber: z.string().min(1).nullish(),
    })
    .optional(),
  gradeId: z.number().optional(),
  sectionId: z.number().optional(),
  avatarUrl: z.string().url().nullish(),
});
