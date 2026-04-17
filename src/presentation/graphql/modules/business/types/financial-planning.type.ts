import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@InputType()
export class MonthlyDataInput {
  @Field(() => Float)
  y1: number;

  @Field(() => Float)
  y2: number;

  @Field(() => Float)
  y3: number;

  @Field(() => Float)
  y4: number;

  @Field(() => Float)
  y5: number;
}

@InputType()
export class FinancialDataInput {
  @Field(() => MonthlyDataInput)
  M1: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M2: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M3: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M4: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M5: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M6: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M7: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M8: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M9: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M10: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M11: MonthlyDataInput;

  @Field(() => MonthlyDataInput)
  M12: MonthlyDataInput;
}

@InputType()
export class CreateFinancialPlanningInput {
  @Field(() => String)
  businessId: string;

  @Field(() => FinancialDataInput)
  sales: FinancialDataInput;

  @Field(() => FinancialDataInput)
  breakeven: FinancialDataInput;

  @Field(() => String)
  breakevenPoint: string;

  @Field(() => String)
  financialPlanDescription: string;

  @Field(() => String)
  risksAndMitigations: string;

  @Field(() => String)
  futurePlans: string;
}

@ObjectType()
export class MonthlyData {
  @Field(() => Float, { nullable: true })
  y1: number;

  @Field(() => Float, { nullable: true })
  y2: number;

  @Field(() => Float, { nullable: true })
  y3: number;

  @Field(() => Float, { nullable: true })
  y4: number;

  @Field(() => Float, { nullable: true })
  y5: number;
}

@ObjectType()
export class FinancialData {
  @Field(() => MonthlyData, { nullable: true })
  M1: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M2: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M3: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M4: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M5: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M6: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M7: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M8: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M9: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M10: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M11: MonthlyData;

  @Field(() => MonthlyData, { nullable: true })
  M12: MonthlyData;
}
@ObjectType()
export class CreateFinancialPlanningResult extends BaseResult {
  @Field(() => Float, { nullable: true })
  score?: number;
}
