import { DateTime } from 'luxon';
import { z } from 'zod';

export const AssignChallengeSchema = z
  .object({
    challengeId: z.string().regex(/^\d+$/),
    startAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((val) => DateTime.fromFormat(val, 'yyyy-MM-dd').isValid),
    endAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((val) => DateTime.fromFormat(val, 'yyyy-MM-dd').isValid),
    schoolId: z.string().regex(/^\d+$/).optional(),
    gradeId: z.number().optional(),
    studentIds: z.array(z.string().regex(/^\d+$/)).optional(),
  })
  .refine((data) => {
    const start = DateTime.fromFormat(data.startAt, 'yyyy-MM-dd');
    const end = DateTime.fromFormat(data.endAt, 'yyyy-MM-dd');
    return end > start;
  });
