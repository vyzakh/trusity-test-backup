import { z } from 'zod';

const wordCount = (text: string) => text.trim().split(/\s+/).length;

export const validateWordCount = (min: number, max: number, field: string) =>
  z.string().refine(
    (val) => {
      const count = wordCount(val);
      return count >= min && count <= max;
    },
    {
      message: `${field} must be between ${min} and ${max} words`,
    },
  );
