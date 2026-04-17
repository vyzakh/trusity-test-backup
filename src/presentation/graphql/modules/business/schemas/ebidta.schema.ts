import { z } from 'zod';

const costValidation = z
  .number({
    invalid_type_error: 'Cost must be a number',
    required_error: 'Cost is required',
  })
  .refine((val) => val.toString().length <= 25, {
    message: 'Cost must not exceed 25 digits',
  });

const YearlyCostSchema = z.object({
  y1: costValidation,
  y2: costValidation,
  y3: costValidation,
  y4: costValidation,
  y5: costValidation,
});

const EbidtaItemSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name cannot be empty')
    .max(255, 'Name cannot exceed 255 characters'),

  cost: YearlyCostSchema,
});

export const CreateEbidtaSchema = z.object({
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
  interest: z.array(EbidtaItemSchema).min(1, 'At least one interest item is required'),
  taxes: z.array(EbidtaItemSchema).min(1, 'At least one taxes item is required'),
  ebidtaCalculation: z.object({
    grossRevenue: YearlyCostSchema,
    cogs: YearlyCostSchema,
    operatingExpenses: YearlyCostSchema,
    interest: YearlyCostSchema,
    taxes: YearlyCostSchema,
    netIncome: YearlyCostSchema,
    ebit: YearlyCostSchema,
    depreciation: YearlyCostSchema,
    amortization: YearlyCostSchema,
    ebitda: YearlyCostSchema,
    ebitdaMargin: YearlyCostSchema,
  }),
});

export type CreateEbidtaSchemaType = z.infer<typeof CreateEbidtaSchema>;
