import { z } from 'zod';

export const DeleteFeedbackSchema = z.object({
  feedbackId: z.string(),
});
