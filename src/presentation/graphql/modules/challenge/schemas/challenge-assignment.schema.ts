import { z } from 'zod';

export const ChallengeAssignmentSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  challengeId: z.string().regex(/^\d+$/),
});
