import { z } from 'zod';
import { BusinessIdSchema } from './branding.schema';

export const GenerateMarketPlan = z.object({
  businessId: BusinessIdSchema,
  marketing: z.string().min(1, 'Marketing strategy is required'),
  competitorAnalysis: z.string().min(1, 'Competitor analysis is required'),
});

export const SaveMarketPlan = z.object({
  businessId: BusinessIdSchema,
  marketing: z.string().min(1, 'Marketing strategy is required'),
  competitorAnalysis: z.string().min(1, 'Competitor analysis is required'),
  marketingFeedback: z.string().min(1, 'Marketing plan feedback is required'),
  score: z.number({
    required_error: 'Score is required',
  }),
});
