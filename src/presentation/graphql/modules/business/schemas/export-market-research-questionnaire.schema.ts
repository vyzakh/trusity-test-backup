import z from 'zod';

export const ExportMarketResearchQuestionnaireSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  questionnaire: z.array(
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
