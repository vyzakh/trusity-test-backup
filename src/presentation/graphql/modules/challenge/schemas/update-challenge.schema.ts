import { ChallengeVisibility } from '@shared/enums';
import { z } from 'zod';

export const UpdateChallengeSchema = z.object({
  challengeId: z.string().regex(/^\d+$/),
  title: z.string().min(1).max(100).optional(),
  companyName: z.string().min(1).max(100).optional(),
  sectorId: z.number().optional(),
  description: z.string().min(1).max(600).optional(),
  visibility: z.nativeEnum(ChallengeVisibility),
  sdgIds: z.array(z.number()).min(1).max(2).optional(),
  expectation: z.string().min(1).max(600).optional(),
  logoUrl: z.string().nullable().optional(),
  targetGrades: z.array(z.number()).optional(),
  targetStudents: z.array(z.string()).optional(),
});
