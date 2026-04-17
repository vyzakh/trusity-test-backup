import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const CreateB2BSchoolSchema = z
  .object({
    name: z.string().min(1).max(100),
    accountType: z.literal(BusinessModelEnum.B2B),
    curriculums: z
      .array(
        z.object({
          id: z.number().int(),
          name: z.string().max(50).nullable().optional(),
        }),
      )
      .min(1),
    totalLicense: z.number().nonnegative().int(),
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
    contact: z.object({
      name: z.string().min(1).max(100),
      contactNumber: z.string(),
      email: z
        .string()
        .email()
        .max(255)
        .transform((val) => val.toLowerCase()),
    }),
    logoUrl: z.string().nullable().optional(),
  })
  .strict();

export type CreateB2BSchoolInput = z.infer<typeof CreateB2BSchoolSchema>;
