import z from 'zod';
import { SchoolStatusAction } from '@shared/enums';

export const ToggleSchoolActivationSchema = z.object({
  schoolId: z.string().regex(/^\d+$/),
  action: z.nativeEnum(SchoolStatusAction),
});
