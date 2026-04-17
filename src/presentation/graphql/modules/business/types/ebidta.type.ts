import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { YearlyCost, YearlyCostInput } from './opex.type';

@InputType()
export class EbidtaItemInput {
  @Field()
  name: string;

  @Field(() => YearlyCostInput)
  cost: YearlyCostInput;
}

@InputType()
export class EbidtaCalculationInput {
  @Field(() => YearlyCostInput)
  grossRevenue: YearlyCostInput;

  @Field(() => YearlyCostInput)
  cogs: YearlyCostInput;

  @Field(() => YearlyCostInput)
  operatingExpenses: YearlyCostInput;

  @Field(() => YearlyCostInput)
  interest: YearlyCostInput;

  @Field(() => YearlyCostInput)
  taxes: YearlyCostInput;

  @Field(() => YearlyCostInput)
  netIncome: YearlyCostInput;

  @Field(() => YearlyCostInput)
  ebit: YearlyCostInput;

  @Field(() => YearlyCostInput)
  depreciation: YearlyCostInput;

  @Field(() => YearlyCostInput)
  amortization: YearlyCostInput;

  @Field(() => YearlyCostInput)
  ebitda: YearlyCostInput;

  @Field(() => YearlyCostInput)
  ebitdaMargin: YearlyCostInput;
}

@InputType()
export class CreateEbidtaInput {
  @Field(() => String)
  businessId: string;

  @Field(() => [EbidtaItemInput])
  interest: EbidtaItemInput[];

  @Field(() => [EbidtaItemInput])
  taxes: EbidtaItemInput[];

  @Field(() => EbidtaCalculationInput)
  ebidtaCalculation: EbidtaCalculationInput;
}

@ObjectType()
export class EbidtaItem {
  @Field()
  name: string;

  @Field(() => YearlyCost)
  cost: YearlyCost;
}

@ObjectType()
export class EbidtaCalculation {
  @Field(() => YearlyCost)
  grossRevenue: YearlyCost;

  @Field(() => YearlyCost)
  cogs: YearlyCost;

  @Field(() => YearlyCost)
  operatingExpenses: YearlyCost;

  @Field(() => YearlyCost)
  interest: YearlyCost;

  @Field(() => YearlyCost)
  taxes: YearlyCost;

  @Field(() => YearlyCost)
  netIncome: YearlyCost;

  @Field(() => YearlyCost)
  ebit: YearlyCost;

  @Field(() => YearlyCost)
  depreciation: YearlyCost;

  @Field(() => YearlyCost)
  amortization: YearlyCost;

  @Field(() => YearlyCost)
  ebitda: YearlyCost;

  @Field(() => YearlyCost)
  ebitdaMargin: YearlyCost;
}

@ObjectType()
export class Ebidta {
  @Field(() => [EbidtaItem], { nullable: true })
  interest: EbidtaItem[];

  @Field(() => [EbidtaItem], { nullable: true })
  taxes: EbidtaItem[];

  @Field(() => EbidtaCalculation)
  ebidtaCalculation: EbidtaCalculation;
}
@ObjectType()
export class CreateEbidtaResult extends BaseResult {}
