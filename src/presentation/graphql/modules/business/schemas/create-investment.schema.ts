import { z } from 'zod';

const InvestmentFundSourceSchema = z.object({
  source: z.string().min(1, 'Source is required'),
});

const InvestmentNextStepSchema = z.object({
  actionItem: z.string().min(1, 'Action item is required'),
  step: z.string().min(1, 'Step is required'),
  due: z.string().min(1, 'Due date is required'),
});

const InvestmentFundPitchStatementSchema = z.object({
  pitchStatement: z.string().min(1, 'Pitch statement is required'),
});

export const InvestmentValueEdgeSchema = z.object({
  fundCase: z
    .string()
    .min(1, 'fundCase is required')
    .transform((s) => s.trim()),
});

export const InvestmentFundGoalSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  cost: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Cost must be a valid number'),
  outcome: z.string().min(1, 'Outcome is required'),
});

export const InvestmentFundPlanSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
  description: z.string().min(1, 'Description is required'),
  importance: z.string().min(1, 'Importance is required'),
});

export const CreateInvestmentSchema = z
  .object({
    businessId: z.string().regex(/^\d+$/, 'businessId must be a number'),
    amount: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number string')
      .refine((val) => parseFloat(val) > 0, {
        message: 'Amount must be greater than 0',
      }),
    purpose: z.string(),
    valueEdge: InvestmentValueEdgeSchema,
    fundGoals: z.array(InvestmentFundGoalSchema).min(1, 'At least one goal is required'),
    fundPlan: z.array(InvestmentFundPlanSchema).min(1, 'At least one plan is required'),
    fundSource: InvestmentFundSourceSchema,
    nextStep: z.array(InvestmentNextStepSchema).min(1, 'At least one step is required'),
    fundPitchStatement: InvestmentFundPitchStatementSchema,
  })
  .refine(
    (data) => {
      const totalPlanAmount = data.fundPlan.reduce((sum, plan) => sum + parseFloat(plan.amount), 0);
      return totalPlanAmount <= parseFloat(data.amount);
    },
    {
      message: 'Total fundPlan amounts must not exceed the overall investment amount',
      path: ['fundPlan'],
    },
  );
