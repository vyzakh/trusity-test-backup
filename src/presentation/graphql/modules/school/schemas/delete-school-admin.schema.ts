import { z } from 'zod';

export const DeleteSchoolAdminSchema = z.object({
  schoolAdminId: z.string().regex(/^\d+$/),
});
