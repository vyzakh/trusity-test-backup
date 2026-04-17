import { z } from 'zod';

export const LoginSchema = z
  .object({
    email: z.string().email().max(255).transform((val) => val.toLowerCase()),
    password: z.string().min(1),
  })
  .strict();
