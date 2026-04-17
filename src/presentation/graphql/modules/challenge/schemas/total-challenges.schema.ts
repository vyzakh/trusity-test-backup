import { z } from 'zod';
import { ChallengeCreatorType, ChallengeScope } from '@shared/enums';

export const TotalChallengesSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  creatorType: z.nativeEnum(ChallengeCreatorType).optional(),
  title: z.string().optional(),
  scope: z.nativeEnum(ChallengeScope).optional(),
});
