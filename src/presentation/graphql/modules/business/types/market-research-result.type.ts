import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@ObjectType()
class QuestionnaireResult {
  @Field(() => String)
  yes: string;

  @Field(() => String)
  no: string;

  @Field(() => String)
  yesPercentage: string;

  @Field(() => String)
  noPercentage: string;

  @Field(() => String)
  question: string;
}

@ObjectType()
export class CreateMarketResearchResult extends BaseResult {
  @Field(() => String)
  marketResearch: string;

  @Field(() => String)
  targetMarket: string;

  @Field(() => String, { nullable: true })
  marketResearchData?: string;

  @Field(() => String, { nullable: true })
  competitors?: string;

  @Field(() => [QuestionnaireResult])
  questionnaire: QuestionnaireResult[];

  @Field(() => String)
  score: string;

  @Field(() => String)
  summary: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
@ObjectType()
export class DownloadMarketResearchQuestionnaireResult extends BaseResult {
  @Field(() => String)
  marketResearchQuestionnairePDF: string;
}
@ArgsType()
export class DownloadMarketResearchQuestionnaireInput {
  @Field(() => String)
  businessId: string;
}
