import { ChallengeVisibility } from '@shared/enums';
import { z } from 'zod';

export const CreateChallengeSchema = z.object({
  input: z.object({
    title: z.string().min(1).max(100),
    companyName: z.string().min(1).max(100),
    sectorId: z.number(),
    description: z.string().min(1).max(600),
    visibility: z.nativeEnum(ChallengeVisibility),
    sdgIds: z.array(z.number()).min(1).max(2),
    expectation: z.string().min(1).max(600),
    logoUrl: z.string().nullable(),
    targetGrades: z.array(z.number()).optional(),
    targetStudents: z.array(z.string()).optional(),
  }),
});
