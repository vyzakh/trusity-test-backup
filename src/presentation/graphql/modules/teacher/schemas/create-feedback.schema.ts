import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { z } from 'zod';

export const CreateFeedbackSchema = z.object({
  businessStep: z.nativeEnum(BusinessPhaseStepEnum),
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
  feedback: z.string().min(1).max(5000),
  fileUrl: z.array(z.string().url()).optional(),
});

export const FeedbacksSchema = z.object({
  businessStep: z.nativeEnum(BusinessPhaseStepEnum).optional(),
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
});
export const FeedbackSchema = z.object({
  feedbackId: z.string().regex(/^\d+$/, 'Feedback ID must be numeric'),
});
