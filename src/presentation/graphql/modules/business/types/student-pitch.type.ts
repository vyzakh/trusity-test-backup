import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
export class StudentPitchScripts {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  narrative?: string;

  @Field(() => String, { nullable: true })
  pitchDescription?: string;

  @Field(() => String)
  aiGeneratedScript: string;
}

@ObjectType()
export class StudentPitchScriptsResult extends BaseResult {
  @Field(() => StudentPitchScripts)
  StudentPitchScripts: StudentPitchScripts;
}

@ObjectType()
export class StudentPitchPracticeAndFeedback {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  pitchPracticeVideoUrl?: string;

  @Field(() => String)
  pitchAiGeneratedFeedback: string;

  @Field(() => String)
  score: string;
}

@ObjectType()
export class StudentPitchPracticeAndFeedbackResult extends BaseResult {
  @Field(() => StudentPitchPracticeAndFeedback)
  StudentPitchScripts: StudentPitchPracticeAndFeedback;
}

@ObjectType()
export class SaveStudentPitchPracticeAndFeedback {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  pitchPracticeVideoUrl?: string;

  @Field(() => String)
  pitchAiGeneratedFeedback: string;

  @Field(() => String)
  score: string;
}

@ObjectType()
export class PitchDeckPDF extends BaseResult {
  @Field(() => String)
  pitchDeckPDF: string;
}

@ArgsType()
export class ExportPitchDeckInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  callToAction: string;
}

@ObjectType()
export class SaveStudentPitchPracticeAndFeedbackResult extends BaseResult {
  @Field(() => SaveStudentPitchPracticeAndFeedback)
  StudentPitchScripts: SaveStudentPitchPracticeAndFeedback;
}

@ObjectType()
export class PitchDeckPPTX extends BaseResult {
  @Field(() => String)
  fileUrl?: string;
}

@ObjectType()
export class ListPitchDeckTemplatesResponse {
  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => Number)
  statusCode: number;

  @Field(() => [ListPitchDeckTemplates])
  pitchDeckTemplates: ListPitchDeckTemplates[];
}

@ObjectType()
export class ListPitchDeckTemplates {
  @Field(() => Number, { nullable: true })
  id: number;

  @Field(() => String)
  code: string;

  @Field(() => String, { nullable: true })
  templateUrl?: string;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

import { Float, InputType } from '@nestjs/graphql';

/* ---------------- BUSINESS MODEL ---------------- */
@InputType('BusinessModelInputType')
class BusinessModelInput {
  @Field(() => String, { nullable: true }) valuePropositions?: string;
  @Field(() => String, { nullable: true }) customerSegments?: string;
  @Field(() => String, { nullable: true }) revenueStreams?: string;
  @Field(() => String, { nullable: true }) keyResources?: string;
  @Field(() => String, { nullable: true }) keyActivities?: string;
  @Field(() => String, { nullable: true }) keyPartners?: string;
}

/* ---------------- REVENUE MODEL ---------------- */
@InputType('RevenueModelInputType')
class RevenueModelInput {
  @Field(() => String, { nullable: true }) revenueModel?: string;
  @Field(() => String, { nullable: true }) currencyCode?: string;
}

/* ---------------- CAPEX ---------------- */
@InputType('CapexItemInputType')
class CapexItemInput {
  @Field(() => Float) cost: number;
  @Field(() => String) name: string;
}

/* ---------------- YEARLY COST ---------------- */
@InputType('YearlyCostInputType')
class YearlyCostInput {
  @Field(() => Float) y1: number;
  @Field(() => Float) y2: number;
  @Field(() => Float) y3: number;
  @Field(() => Float) y4: number;
  @Field(() => Float) y5: number;
}

/* ---------------- OPEX ---------------- */
@InputType('OpexInputType')
class OpexInput {
  @Field(() => YearlyCostInput) M1: YearlyCostInput;
  @Field(() => YearlyCostInput) M2: YearlyCostInput;
}

@InputType('OpexWrapperInputType')
class OpexWrapperInput {
  @Field(() => OpexInput) opex: OpexInput;
}

/* ---------------- SALES ---------------- */
@InputType('SalesInputType')
class SalesInput {
  @Field(() => YearlyCostInput) M1: YearlyCostInput;
  @Field(() => YearlyCostInput) M2: YearlyCostInput;
}

/* ---------------- BREAKEVEN ---------------- */
@InputType('BreakevenInputType')
class BreakevenInput {
  @Field(() => YearlyCostInput) M1: YearlyCostInput;
  @Field(() => YearlyCostInput) M2: YearlyCostInput;
}

/* ---------------- MAIN PITCH DECK INPUT ---------------- */
@InputType('PitchDeckInputType')
export class PitchDeckInput {
  @Field(() => String) businessName: string;

  @Field(() => String, { nullable: true }) idea?: string;
  @Field(() => String, { nullable: true }) problemStatement?: string;
  @Field(() => String, { nullable: true }) pitchDescription?: string;
  @Field(() => String, { nullable: true }) targetMarket?: string;
  @Field(() => String, { nullable: true }) marketResearch?: string;
  @Field(() => String, { nullable: true }) marketFit?: string;
  @Field(() => String, { nullable: true }) prototypeDescription?: string;

  @Field(() => BusinessModelInput, { nullable: true }) businessModel?: BusinessModelInput;
  @Field(() => RevenueModelInput, { nullable: true }) revenueModel?: RevenueModelInput;

  @Field(() => [CapexItemInput], { nullable: true }) capex?: CapexItemInput[];
  @Field(() => String, { nullable: true }) capexTotal?: string;

  @Field(() => [OpexWrapperInput], { nullable: true }) opex?: OpexWrapperInput[];
  @Field(() => [SalesInput], { nullable: true }) sales?: SalesInput[];
  @Field(() => [BreakevenInput], { nullable: true }) breakeven?: BreakevenInput[];

  @Field(() => String, { nullable: true }) breakevenPoint?: string;
  @Field(() => String, { nullable: true }) financialPlanDescription?: string;
  @Field(() => String, { nullable: true }) risksAndMitigations?: string;
  @Field(() => String, { nullable: true }) futurePlans?: string;
  @Field(() => String, { nullable: true }) branding?: string;
  @Field(() => String, { nullable: true }) customerExperience?: string;
  @Field(() => String, { nullable: true }) marketing?: string;
}

@ObjectType()
class PitchDeckData {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  callToAction: string;
}

@ObjectType()
export class SavePitchDeck extends BaseResult {
  @Field(() => PitchDeckData)
  data: PitchDeckData;
}
@InputType()
export class PitchDeckInputs {
  @Field(() => String)
  businessId: string;
}
// import { InputType, Field, Int, Float } from "@nestjs/graphql";

// @InputType()
// class PrototypeOptionInput {
//   @Field()
//   name: string;
// }

// @InputType()
// class BrandingInput {
//   @Field()
//   brandVoice: string;
// }

// @InputType()
// class BusinessModelInput {
//   @Field()
//   targetMarketSize: string;

//   @Field()
//   revenueStreams: string;

//   @Field()
//   customerSegments: string;

//   @Field()
//   customerRelationships: string;
// }

// @InputType()
// class CapexInput {
//   @Field()
//   name: string;

//   @Field(() => Float)
//   cost: number;
// }

// @InputType()
// class OpexYearInput {
//   @Field(() => Int)
//   y1: number;

//   @Field(() => Int)
//   y2: number;

//   @Field(() => Int)
//   y3: number;

//   @Field(() => Int)
//   y4: number;

//   @Field(() => Int)
//   y5: number;
// }

// @InputType()
// class OpexItemInput {
//   @Field(() => OpexYearInput)
//   M1?: OpexYearInput;

//   @Field(() => OpexYearInput, { nullable: true })
//   M10?: OpexYearInput;

//   @Field(() => OpexYearInput, { nullable: true })
//   M11?: OpexYearInput;
// }

// @InputType()
// class OpexInput {
//   @Field(() => OpexItemInput)
//   opex: OpexItemInput;
// }

// @InputType()
// class RevenueModelInput {
//   @Field()
//   currencyCode: string;

//   @Field(() => Int)
//   currencyId: number;

//   @Field()
//   revenueModel: string;

//   @Field(() => Int)
//   unitSalesPercentage: number;
// }

// @InputType()
// class MarketQuestionnaireInput {
//   @Field()
//   question: string;
// }

// @InputType()
// export class PitchDeckInputOne {
//   @Field()
//   businessName: string;

//   @Field()
//   idea: string;

//   @Field()
//   competitorAnalysis: string;

//   @Field()
//   financialPlanDescription: string;

//   @Field()
//   futurePlans: string;

//   @Field()
//   problemStatement: string;

//   @Field()
//   targetMarket: string;

//   @Field()
//   marketCompetitors: string;

//   @Field()
//   marketFit: string;

//   @Field()
//   marketFitFeedback: string;

//   @Field()
//   marketing: string;

//   @Field()
//   marketingFeedback: string;

//   @Field()
//   breakevenPoint: string;

//   @Field(() => [PrototypeOptionInput])
//   availablePrototypeOptions: PrototypeOptionInput[];

//   @Field(() => BrandingInput)
//   branding: BrandingInput;

//   @Field(() => BusinessModelInput)
//   businessModel: BusinessModelInput;

//   @Field(() => [CapexInput])
//   capex: CapexInput[];

//   @Field(() => [OpexInput])
//   opex: OpexInput[];

//   @Field(() => RevenueModelInput)
//   revenueModel: RevenueModelInput;

//   @Field(() => [MarketQuestionnaireInput])
//   marketQuestionnaire: MarketQuestionnaireInput[];

//   @Field({ nullable: true })
//   callToAction?: string;
// }
