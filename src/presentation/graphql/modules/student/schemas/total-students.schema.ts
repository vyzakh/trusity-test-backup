import { BusinessModelEnum } from '@shared/enums';
import { z } from 'zod';

export const TotalStudentsSchema = z.object({
  name: z.string().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
  schoolGradeId: z.string().regex(/^\d+$/).optional(),
  schoolSectionId: z.string().regex(/^\d+$/).optional(),
  accountType: z.nativeEnum(BusinessModelEnum).optional(),
});
