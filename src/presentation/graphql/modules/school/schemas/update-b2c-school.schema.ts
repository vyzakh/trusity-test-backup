import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const UpdateB2CSchoolSchema = z
  .object({
    schoolId: z.string().regex(/^\d+$/),
    name: z.string().max(100).optional(),
    accountType: z.literal(BusinessModelEnum.B2C),
    address: z
      .object({
        countryId: z.string().regex(/^\d+$/).nullable().optional(),
        streetAddressLine1: z.string().max(150).nullable().optional(),
        streetAddressLine2: z.string().max(150).nullable().optional(),
        cityId: z.string().regex(/^\d+$/).nullable().optional(),
        stateId: z.string().regex(/^\d+$/).nullable().optional(),
        postalCode: z.string().max(20).nullable().optional(),
        contactNumber: z.string().nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
