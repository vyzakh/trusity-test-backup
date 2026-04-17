import { ArgsType, Field, Float, InputType } from '@nestjs/graphql';
import { BusinessStatus } from '@shared/enums';
import { ComparisonOperator } from '@shared/enums/business-performance.enum';

@InputType()
export class IECScoreFilter {
  @Field(() => ComparisonOperator)
  comparison: ComparisonOperator;

  @Field(() => Float)
  scoreValue: number;
}

@ArgsType()
export class BusinessProgressFilterArgs {
  @Field(() => String, { nullable: true })
  schoolId?: string;

  @Field(() => String, { nullable: true })
  studentId?: string;

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;

  @Field(() => [IECScoreFilter], { nullable: true })
  iecFilters?: IECScoreFilter[];
}
