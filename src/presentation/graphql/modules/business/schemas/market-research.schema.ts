import z from 'zod';

export const GetMarketResearchSchema = z.object({
  targetMarket: z.string(),
  marketResearch: z.string(),
});

const QuestionnaireSchema = z.object({
  yes: z.string(),
  no: z.string(),
  yesPercentage: z.string(),
  noPercentage: z.string(),
  question: z.string(),
});

export const CreateMarketResearchSchema = z.object({
  marketResearch: z.string().min(1, 'marketResearch is required'),
  targetMarket: z.string().min(1, 'targetMarket is required'),
  marketResearchData: z.string().optional(),
  competitors: z.string().optional(),
  questionnaire: z.array(QuestionnaireSchema).nonempty('At least one questionnaire is required'),
  score: z.string().min(1, 'score is required'),
  summary: z.string().min(1, 'summary is required'),
});
export const DownloadMarketResearchQuestionnaireSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
});
