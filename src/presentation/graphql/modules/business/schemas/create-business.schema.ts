import { BusinessSource } from '@shared/enums';
import z from 'zod';

export const CreateBusinessSchema = z
  .object({
    source: z.nativeEnum(BusinessSource),
    businessName: z.string().min(1).max(150),
    idea: z.string().min(1).max(1500),
    sdgIds: z.array(z.number()).min(1).max(2).nullable().optional(),
    challengeId: z.string().regex(/^\d+$/).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.source) {
      case BusinessSource.CHALLENGE: {
        if (!data.challengeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'challengeId is required when source is "challenge"',
            path: ['challengeId'],
          });
        }
        break;
      }
      case BusinessSource.DIRECT: {
        if (data.challengeId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'challengeId must be null or omitted when source is "direct"',
            path: ['challengeId'],
          });
        }
        break;
      }
    }
  });
