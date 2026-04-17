import { z } from 'zod';

export const CreateBusinesseSchema = z.object({
  input: z.object({
    title: z.string().min(1).max(150),
    companyName: z.string().min(1).max(150),
    sectorId: z.number(),
    description: z.string().min(1).max(600),
    sdgIds: z.array(z.number()).min(1).max(2),
    expectation: z.string().min(1).max(600),
    logoUrl: z.string().nullable(),
  }),
});
