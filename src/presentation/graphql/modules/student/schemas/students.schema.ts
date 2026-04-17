import { BusinessModelEnum, BusinessStatus } from '@shared/enums';
import { ComparisonOperator } from '@shared/enums/business-performance.enum';
import { z } from 'zod';

export const IECScoreFilterSchema = z.object({
  comparison: z.nativeEnum(ComparisonOperator),
  scoreValue: z.number(),
});

export const StudentsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  name: z.string().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
  countryId: z.string().regex(/^\d+$/).optional(),
  academicYearId: z.string().regex(/^\d+$/).optional(),
  accountType: z.nativeEnum(BusinessModelEnum).optional(),
  enrollmentStatus: z.string().optional(),
  gradeId: z.number().optional(),
  sectionId: z.number().optional(),
  teacherId: z.string().regex(/^\d+$/).optional(),
  businessStatus: z.nativeEnum(BusinessStatus).optional(),
  I: IECScoreFilterSchema.optional(),
  E: IECScoreFilterSchema.optional(),
  C: IECScoreFilterSchema.optional(),
});
