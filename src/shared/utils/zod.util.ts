import { ZodIssue } from 'zod';

export function formatZodErrors(errors: ZodIssue[]) {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
}
