import { z } from 'zod';

export const SchoolAdminSchema = z.object({
  schoolAdminId: z.string().regex(/^\d+$/),
});
