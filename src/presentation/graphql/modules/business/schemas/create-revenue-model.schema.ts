import { z } from 'zod';

export const CreateRevenueModelSchema = z.object({
  businessId: z.string().regex(/^\d+$/),
  currencyId: z.number(),
  revenueModel: z.string().nonempty(),
  unitSalesPercentage: z.number(),
});
