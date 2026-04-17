import { z } from 'zod';

export const DeleteTeacherSchema = z
  .object({
    teacherId: z.string().regex(/^\d+$/),
  })
  .strict();
