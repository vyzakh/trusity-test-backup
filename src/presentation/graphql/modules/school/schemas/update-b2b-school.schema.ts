import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const UpdateSchoolSchema = z
  .object({
    schoolId: z.string().regex(/^\d+$/).nullish(),
    name: z.string().max(100).optional(),
    accountType: z.nativeEnum(BusinessModelEnum),
    curriculums: z
      .array(
        z.object({
          id: z.number().int(),
          name: z.string().max(50).nullish(),
        }),
      )
      .min(1)
      .optional(),
    academicStartMonth: z.number().int().min(1).max(12).nullish(),
    academicEndMonth: z.number().int().min(1).max(12).nullish(),
    promotionStartMonth: z.number().int().min(1).max(12).nullish(),
    promotionStartDay: z.number().int().min(1).max(31).nullish(),
    totalLicense: z.number().nonnegative().int().optional(),
    licenseExpiry: z.date().nullish().optional(),
    address: z
      .object({
        countryId: z.string().regex(/^\d+$/).nullish(),
        streetAddressLine1: z.string().max(150).nullish(),
        streetAddressLine2: z.string().max(150).nullish(),
        cityId: z.string().regex(/^\d+$/).nullish(),
        stateId: z.string().regex(/^\d+$/).nullish(),
        postalCode: z.string().max(20).nullish(),
        contactNumber: z.string().nullish(),
      })
      .optional(),
    principalName: z.string().max(60).nullish(),
    contact: z
      .object({
        name: z.string().max(100).optional(),
        contactNumber: z.string().optional(),
        email: z
          .string()
          .email()
          .max(255)
          .optional()
          .transform((val) => val?.toLowerCase()),
      })
      .optional(),
    logoUrl: z.string().nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === BusinessModelEnum.B2B) {
      return;
    }
    if (data.accountType === BusinessModelEnum.B2C) {
      if (!data.schoolId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'schoolId is required for B2C schools',
          path: ['schoolId'],
        });
      }
      if (data.academicStartMonth === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'academicStartMonth cannot be null for B2C schools',
          path: ['academicStartMonth'],
        });
      }
      if (data.academicEndMonth === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'academicEndMonth cannot be null for B2C schools',
          path: ['academicEndMonth'],
        });
      }
    }
  });
