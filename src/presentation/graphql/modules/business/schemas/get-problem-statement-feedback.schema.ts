import { z } from 'zod';

export const GenerateProblemStatementFeedbackSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  problemStatement: z.string(),
});

export const SaveProblemStatementSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  problemStatement: z.string(),
});

export const GenerateMarketResearchDataSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  targetMarket: z.string(),
  marketResearch: z.string(),
});

export const GenerateMarketResearchQuestionsSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  targetMarket: z.string(),
  marketResearch: z.string(),
});

export const GenerateMarketResearchScoreSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  marketResearch: z.string(),
  marketResearchData: z.string(),
  targetMarket: z.string(),
  competitors: z.string(),
  summary: z.string(),
  questions: z.array(
    z.object({
      slNo: z.number().int().positive(),
      question: z.string().min(1),
      yesCount: z.number().int().nonnegative(),
      noCount: z.number().int().nonnegative(),
      yesPercentage: z.number().min(0).max(100),
      noPercentage: z.number().min(0).max(100),
    }),
  ),
});
