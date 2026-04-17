import { z } from 'zod';

export const AssignChallengeInternalSchema = z
  .object({
    challengeId: z.string().regex(/^\d+$/),
    schoolGradeId: z.string().regex(/^\d+$/).optional(),
    schoolSections: z
      .array(
        z.object({
          schoolSectionId: z.string().regex(/^\d+$/),
          isEntire: z.boolean(),
          studentIds: z.array(z.string().regex(/^\d+$/)).optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    data.schoolSections?.forEach((section, i) => {
      if (!section.isEntire && !section.studentIds?.length) {
        ctx.addIssue({
          path: ['schoolSections', i, 'studentIds'],
          message: 'Student IDs are required if not assigning to the entire section',
          code: z.ZodIssueCode.custom,
        });
      }
    });
  });
