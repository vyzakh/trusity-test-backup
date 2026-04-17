import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class BusinessPerformanceReportArgs {
  @Field(() => String, { nullable: false })
  businessId: string;
}
