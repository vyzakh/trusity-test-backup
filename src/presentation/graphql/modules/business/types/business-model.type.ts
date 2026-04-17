import { ArgsType, Field, InputType } from '@nestjs/graphql';

@InputType()
export class SaveBusinessModelInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  keyPartners: string;

  @Field(() => String)
  customerSegments: string;

  @Field(() => String)
  valuePropositions: string;

  @Field(() => String)
  channels: string;

  @Field(() => String)
  customerRelationships: string;

  @Field(() => String)
  revenueStreams: string;

  @Field(() => String)
  keyResources: string;

  @Field(() => String)
  keyActivities: string;

  @Field(() => String)
  costStructure: string;

  @Field(() => String)
  targetMarketSize: string;

  @Field(() => String)
  goalsAndKPIs: string;
}

@ArgsType()
export class ExportBusinessModelInput {
  @Field(() => String)
  businessId: string;
}
