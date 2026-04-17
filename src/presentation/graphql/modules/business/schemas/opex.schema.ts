import { z } from 'zod';

const costValidation = z
  .number({
    invalid_type_error: 'Cost must be a number',
    required_error: 'Cost is required',
  })
  .nonnegative('Cost must be positive')
  .refine((val) => val.toString().length <= 25, {
    message: 'Cost must not exceed 25 digits',
  });

const OpexExpenseSchema = z.object({
  y0: costValidation,
  y1: costValidation,
  y2: costValidation,
  y3: costValidation,
  y4: costValidation,
  y5: costValidation,
});

const MonthlyOpexSchema = z.object({
  y1: costValidation,
  y2: costValidation,
  y3: costValidation,
  y4: costValidation,
  y5: costValidation,
});

const OpexSchema = z.object({
  M1: MonthlyOpexSchema,
  M2: MonthlyOpexSchema,
  M3: MonthlyOpexSchema,
  M4: MonthlyOpexSchema,
  M5: MonthlyOpexSchema,
  M6: MonthlyOpexSchema,
  M7: MonthlyOpexSchema,
  M8: MonthlyOpexSchema,
  M9: MonthlyOpexSchema,
  M10: MonthlyOpexSchema,
  M11: MonthlyOpexSchema,
  M12: MonthlyOpexSchema,
});

const YearlyCostSchema = z.object({
  y1: costValidation,
  y2: costValidation,
  y3: costValidation,
  y4: costValidation,
  y5: costValidation,
});

const OpexItemSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name cannot be empty')
    .max(255, 'Name cannot exceed 255 characters'),

  cost: YearlyCostSchema,
});

export const CreateOpexSchema = z.object({
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
  opexBreakdown: z.array(OpexItemSchema).min(1, 'At least one OPEX breakdown item is required'),
  cogsBreakdown: z.array(OpexItemSchema).min(1, 'At least one COGS breakdown item is required'),
  opexExpense: OpexExpenseSchema,
  opex: OpexSchema,
});

export type CreateOpexSchemaType = z.infer<typeof CreateOpexSchema>;
