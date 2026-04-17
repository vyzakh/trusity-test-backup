import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { MarketResearchQuestion } from '../dto/get-problem-statement.dto';

@ObjectType()
export class marketResearch {
  @Field(() => String)
  id: string;

  @Field(() => String)
  businessName: string;

  @Field(() => String)
  idea: string;

  @Field(() => String)
  studentId: string;

  @Field()
  createdAt: String;

  @Field()
  updatedAt: String;
}

@InputType()
export class ExportMarketResearchQuestionnaireInput {
  @Field(() => String)
  businessId: string;

  @Field(() => [MarketResearchQuestion])
  questionnaire: MarketResearchQuestion[];
}

@ObjectType()
export class ExportMarketResearchQuestionnaireResult {
  @Field(() => String)
  file: string;
}
