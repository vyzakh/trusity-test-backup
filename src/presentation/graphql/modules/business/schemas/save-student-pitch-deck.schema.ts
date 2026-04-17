import { z } from 'zod';

  export const SaveStudentPitchDeckSchema = z
  .object({
    businessId: z.string().readonly(),
    callToAction: z.string().min(1, "Call to action is required"),
  })
  .strict();


