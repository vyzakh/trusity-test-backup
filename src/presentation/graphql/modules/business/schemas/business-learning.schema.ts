import { z } from 'zod';

export const CreateBusinessLearningContentSchema = z.object({
  businessLearningStepId: z.number().nonnegative(),
  sortOrder: z.number().nonnegative().optional(),
  gradeIds: z.array(z.number()),
  fileKeys: z.array(z.string()),
});

export const DeleteBusinessLearningContentSchema = z.object({
  businessLearningContentId: z.number().nonnegative(),
});

export const UpdateBusinessLearningContentOrdersSchema = z.array(
  z.object({
    businessLearningContentId: z.number().nonnegative(),
    sortOrder: z.number().nonnegative(),
  }),
);
