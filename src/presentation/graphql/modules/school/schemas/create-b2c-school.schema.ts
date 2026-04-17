import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const CreateB2CSchoolSchema = z
  .object({
    name: z.string().min(1).max(100),
    accountType: z.literal(BusinessModelEnum.B2C),
    academicStartMonth: z.number().int().min(1).max(12),
    academicEndMonth: z.number().int().min(1).max(12),
    promotionStartMonth: z.number().int().min(1).max(12).nullish(),
    promotionStartDay: z.number().int().min(1).max(31).nullish(),
    address: z.object({
      countryId: z.string().regex(/^\d+$/).nullable().optional(),
      streetAddressLine1: z.string().max(150).nullable().optional(),
      streetAddressLine2: z.string().max(150).nullable().optional(),
      cityId: z.string().regex(/^\d+$/).nullable().optional(),
      stateId: z.string().regex(/^\d+$/).nullable().optional(),
      postalCode: z.string().max(20).nullable().optional(),
      contactNumber: z.string().nullable().optional(),
    }),
  })
  .strict();

export type CreateB2CSchoolInput = z.infer<typeof CreateB2CSchoolSchema>;

export const CreateSchoolSchema = z
  .object({
    accountType: z.nativeEnum(BusinessModelEnum),
    name: z.string().min(1).max(100),
    curriculums: z
      .array(
        z.object({
          id: z.number().int(),
          name: z.string().max(50).nullable().optional(),
        }),
      )
      .optional(),
    totalLicense: z.number().nonnegative().int().optional(),
    licenseExpiry: z.date().nullable().optional(),
    principalName: z.string().max(60).nullish(),
    contact: z
      .object({
        name: z.string().min(1).max(100),
        contactNumber: z.string(),
        email: z
          .string()
          .email()
          .max(255)
          .transform((val) => val.toLowerCase()),
      })
      .optional(),
    academicBaseYear: z.number().int().nullish(),
    academicStartMonth: z.number().int().min(1).max(12).nullish(),
    academicEndMonth: z.number().int().min(1).max(12).nullish(),
    promotionStartMonth: z.number().int().min(1).max(12).nullish(),
    promotionStartDay: z.number().int().min(1).max(31).nullish(),
    address: z.object({
      countryId: z.string().regex(/^\d+$/).nullable().optional(),
      streetAddressLine1: z.string().max(150).nullable().optional(),
      streetAddressLine2: z.string().max(150).nullable().optional(),
      cityId: z.string().regex(/^\d+$/).nullable().optional(),
      stateId: z.string().regex(/^\d+$/).nullable().optional(),
      postalCode: z.string().max(20).nullable().optional(),
      contactNumber: z.string().nullable().optional(),
    }),
    logoUrl: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === BusinessModelEnum.B2B) {
      if (!data.curriculums || data.curriculums.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one curriculum is required for B2B schools',
          path: ['curriculums'],
        });
      }
      if (data.totalLicense == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'totalLicense is required for B2B schools',
          path: ['totalLicense'],
        });
      }
      if (!data.contact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'contact is required for B2B schools',
          path: ['contact'],
        });
      }
    }
    if (data.accountType === BusinessModelEnum.B2C) {
      if (!data.academicStartMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'academicStartMonth is required for B2C schools',
          path: ['academicStartMonth'],
        });
      }
      if (!data.academicEndMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'academicEndMonth is required for B2C schools',
          path: ['academicEndMonth'],
        });
      }
    }
  });
