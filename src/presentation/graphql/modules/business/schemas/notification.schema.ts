import { z } from 'zod';

export const GetNotificationsSchema = z.object({
  limit: z.number().int().max(100, 'Limit cannot be more than 100').nullable(),
  offset: z.number().int().nullable(),
});

export const UpdateReadNotificationsSchema = z.object({
  read: z.array(z.string().regex(/^\d+$/, { message: 'Each value must be a valid integer string' })).nonempty({ message: 'array cannot be empty' }),
});

export const deleteNotificationsSchema = z.object({
  ids: z.array(z.string().regex(/^\d+$/)).nonempty(),
});
