import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@InputType()
export class OpexExpenseInput {
  @Field(() => Float)
  y0: number;

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
export class YearlyCostInput {
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
export class OpexItemInput {
  @Field()
  name: string;

  @Field(() => YearlyCostInput)
  cost: YearlyCostInput;
}

@InputType()
export class MonthlyOpexInput {
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
export class OpexInput {
  @Field(() => MonthlyOpexInput)
  M1: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M2: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M3: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M4: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M5: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M6: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M7: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M8: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M9: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M10: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M11: MonthlyOpexInput;

  @Field(() => MonthlyOpexInput)
  M12: MonthlyOpexInput;
}

@InputType()
export class CreateOpexInput {
  @Field(() => String)
  businessId: string;

  @Field(() => [OpexItemInput])
  opexBreakdown: OpexItemInput[];

  @Field(() => [OpexItemInput])
  cogsBreakdown: OpexItemInput[];

  @Field(() => OpexExpenseInput)
  opexExpense: OpexExpenseInput;

  @Field(() => OpexInput)
  opex: OpexInput;
}

@ObjectType()
export class OpexExpense {
  @Field(() => Float, { nullable: true })
  y0: number;

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
export class YearlyCost {
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

@ObjectType()
export class OpexItem {
  @Field()
  name: string;

  @Field(() => YearlyCost)
  cost: YearlyCost;
}

@ObjectType()
export class MonthlyOpex {
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
export class OpexData {
  @Field(() => MonthlyOpex, { nullable: true })
  M1: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M2: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M3: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M4: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M5: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M6: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M7: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M8: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M9: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M10: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M11: MonthlyOpex;

  @Field(() => MonthlyOpex, { nullable: true })
  M12: MonthlyOpex;
}

@ObjectType()
export class Opex {
  @Field(() => OpexData, { nullable: true })
  opex: OpexData;

  @Field(() => OpexExpense, { nullable: true })
  opexExpense: OpexExpense;

  @Field(() => [OpexItem], { nullable: true })
  opexBreakdown: OpexItem[];

  @Field(() => [OpexItem], { nullable: true })
  cogsBreakdown: OpexItem[];
}
@ObjectType()
export class CreateOpexResult extends BaseResult {}
