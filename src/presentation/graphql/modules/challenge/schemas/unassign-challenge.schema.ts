import { z } from 'zod';

export const UnassignChallengeSchema = z
  .object({
    challengeId: z.string().regex(/^\d+$/),
    schoolId: z.string().regex(/^\d+$/).optional(),
    schoolGradeId: z.string().regex(/^\d+$/).optional(),
    schoolSectionIds: z.array(z.string().regex(/^\d+$/)).optional(),
    studentIds: z.array(z.string().regex(/^\d+$/)).optional(),
  })
  .strict();
