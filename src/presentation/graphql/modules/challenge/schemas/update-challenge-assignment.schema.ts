import { z } from 'zod';

export const UpdateChallengeAssignmentSchema = z
  .object({
    challengeId: z.string().regex(/^\d+$/),
    schoolId: z.string().regex(/^\d+$/),
    isEntire: z.boolean(),
    gradeIds: z.array(z.string().regex(/^\d+$/)).min(1).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!val.isEntire && (!val.gradeIds || val.gradeIds.length === 0)) {
      ctx.addIssue({
        path: ['grades'],
        message: 'Grades are required if not assigning to entire school',
        code: z.ZodIssueCode.custom,
      });
    }
  });
