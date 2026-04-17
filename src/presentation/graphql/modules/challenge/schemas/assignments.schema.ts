import { ChallengeParticipationEnum } from '@shared/enums';
import { z } from 'zod';

export const AssignmentsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  schoolId: z.string().regex(/^\d+$/).optional(),
  gradeId: z.number().optional(),
  sectionId: z.number().optional(),
  name: z.string().optional(),
  participation: z.nativeEnum(ChallengeParticipationEnum).optional(),
});

export const TotalAssignmentsSchema = z.object({
  schoolId: z.string().regex(/^\d+$/).optional(),
  gradeId: z.number().optional(),
  sectionId: z.number().optional(),
  name: z.string().optional(),
  participation: z.nativeEnum(ChallengeParticipationEnum).optional(),
});
