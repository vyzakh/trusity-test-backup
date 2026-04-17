import { z } from 'zod';

const MonthlyDataSchema = z.object({
  y1: z.number(),
  y2: z.number(),
  y3: z.number(),
  y4: z.number(),
  y5: z.number(),
});

const FinancialDataSchema = z.object({
  M1: MonthlyDataSchema,
  M2: MonthlyDataSchema,
  M3: MonthlyDataSchema,
  M4: MonthlyDataSchema,
  M5: MonthlyDataSchema,
  M6: MonthlyDataSchema,
  M7: MonthlyDataSchema,
  M8: MonthlyDataSchema,
  M9: MonthlyDataSchema,
  M10: MonthlyDataSchema,
  M11: MonthlyDataSchema,
  M12: MonthlyDataSchema,
});

export const CreateFinancialPlanning = z.object({
  businessId: z.string().regex(/^\d+$/, 'Business ID must be numeric'),
  sales: FinancialDataSchema,
  breakeven: FinancialDataSchema,
  breakevenPoint: z.string().min(1, 'Breakeven point is required'),
  financialPlanDescription: z.string().min(1, 'Financial plan description is required'),
  risksAndMitigations: z.string().min(1, 'Risks and mitigations are required'),
  futurePlans: z.string().min(1, 'Future plan required'),
});
