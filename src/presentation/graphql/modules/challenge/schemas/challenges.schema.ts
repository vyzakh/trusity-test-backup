import { z } from 'zod';
import { ChallengeCreatorType, ChallengeScope } from '@shared/enums';

export const ChallengesSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  creatorType: z.nativeEnum(ChallengeCreatorType).optional(),
  title: z.string().optional(),
  scope: z.nativeEnum(ChallengeScope).optional(),
});
