import { Field, InputType, Int } from '@nestjs/graphql';
import { BusinessStatus } from '@shared/enums';

@InputType()
export class TopPerformedBusinessesArgs {
  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}
