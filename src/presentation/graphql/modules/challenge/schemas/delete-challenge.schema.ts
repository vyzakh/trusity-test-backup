import { z } from 'zod';

export const DeleteChallengeSchema = z.object({
  challengeId: z.string().regex(/^\d+$/),
});
