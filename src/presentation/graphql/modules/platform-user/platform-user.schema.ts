import { z } from 'zod';

export const CreatePlatformUserSchema = z.object({
  name: z.string().min(1),
  email: z
    .string()
    .email()
    .max(255)
    .transform((val) => val.toLowerCase()),
  contactNumber: z.string().min(1).optional(),
});

export const AssignPermissionsToPlatformUserSchema = z.object({
  platformUserId: z.string().regex(/^\d+$/),
  permissionIds: z.array(z.number()).optional(),
});

export const TotalPlatformUsersSchema = z.object({
  name: z.string().optional(),
});

export const PlatformUsersSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().nonnegative().optional(),
  name: z.string().optional(),
});

export const PlatformUserSchema = z.object({
  platformUserId: z.string().regex(/^\d+$/),
});
export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().max(255).optional().transform((val) => val?.toLowerCase()),
  contactNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
