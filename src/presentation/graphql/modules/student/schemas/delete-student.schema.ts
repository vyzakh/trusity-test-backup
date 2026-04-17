import { z } from 'zod';

export const DeleteStudentSchema = z.object({
  studentId: z.string().regex(/^\d+$/),
});
