import { Field, ArgsType } from '@nestjs/graphql';
import { BusinessModelEnum } from '@shared/enums';

@ArgsType()
export class DashboardFilterArgs {
  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => BusinessModelEnum, { nullable: true })
  businessType?: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  schoolId?: string;
}
