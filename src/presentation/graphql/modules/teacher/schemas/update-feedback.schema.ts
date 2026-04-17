import { z } from 'zod';

export const UpdateFeedbackSchema = z.object({
  id: z.string(),
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
  feedback: z.string().min(1, 'Feedback cannot be empty').optional(),
  fileUrl: z.array(z.string().url()).optional(),
});
