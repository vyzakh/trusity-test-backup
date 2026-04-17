import { z } from 'zod';

export const CreateCapexSchema = z.object({
  businessId: z.string().regex(/^\d+$/),

  capex: z.array(
    z.object({
      name: z.string().min(1, 'Capex name is required'),

      cost: z
        .number({
          invalid_type_error: 'Capex cost must be a number',
          required_error: 'Capex cost is required',
        })
        .nonnegative('Capex cost must be positive')
        .refine((val) => val.toString().length <= 25, {
          message: 'Capex cost must not exceed 25 digits',
        }),
    }),
  ),
});
