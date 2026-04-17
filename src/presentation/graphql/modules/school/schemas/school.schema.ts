import { BusinessModelEnum, SchoolStatus } from '@shared/enums';
import { z } from 'zod';
import { CreateB2BSchoolInput } from './create-b2b-school.schema';
import { CreateB2CSchoolInput } from './create-b2c-school.schema';
import { IECScoreFilterSchema } from '../../student/schemas';

export const SchoolSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
});

export const TotalSchoolsSchema = z.object({
  accountType: z.nativeEnum(BusinessModelEnum).optional(),
  status: z.nativeEnum(SchoolStatus).optional(),
  name: z.string().optional(),
});

export const SchoolsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  accountType: z.nativeEnum(BusinessModelEnum).optional(),
  status: z.nativeEnum(SchoolStatus).optional(),
  name: z.string().optional(),
  countryId: z.string().regex(/^\d+$/).optional(),
  I: IECScoreFilterSchema.optional(),
  E: IECScoreFilterSchema.optional(),
  C: IECScoreFilterSchema.optional(),
});

export type CreateSchoolInput = CreateB2BSchoolInput | CreateB2CSchoolInput;
