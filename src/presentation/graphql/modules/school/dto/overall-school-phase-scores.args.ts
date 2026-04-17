import { Field, InputType } from '@nestjs/graphql';
import { BusinessStatus } from '@shared/enums/business-status.enum';

@InputType()
export class OverallSchoolPhaseScoresInput {
  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}
