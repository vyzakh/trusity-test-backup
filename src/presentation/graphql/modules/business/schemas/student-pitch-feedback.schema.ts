import { z } from 'zod';

export const CreateStudentFeedbackSchema = z
  .object({
    businessId: z.string().readonly(),
    videoUrl: z.string(),
  })
  .strict();

export const SaveStudentFeedbackSchema = z
  .object({
    businessId: z.string().readonly(),
    videoUrl: z.string(),
    aiGeneratedFeedback: z.string().min(1, "AI generated feedback is required"),
    score: z.number().min(0).max(100)
  })
  .strict();


