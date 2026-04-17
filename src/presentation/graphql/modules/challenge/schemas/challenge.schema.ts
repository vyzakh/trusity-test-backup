import { z } from 'zod';

export const ChallengeSchema = z.object({
  challengeId: z.string().regex(/^\d+$/),
});

export const ChallengeAssignedSchoolGradesSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
});

export const ChallengeAssignedSchoolSectionsSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  schoolGradeId: z.string().regex(/^\d+$/),
});

export const HideChallengeSchema = z.object({
  challengeId: z.string().regex(/^\d+$/),
  hidden: z.boolean(),
});
