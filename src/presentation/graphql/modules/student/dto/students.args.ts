import { ArgsType, Field, Int } from '@nestjs/graphql';
import { BusinessModelEnum, BusinessStatus } from '@shared/enums';
import { IECScoreFilter } from './business-progress.args';

@ArgsType()
export class StudentsArgs {
  @Field(() => Int, { nullable: true })
  offset: number;

  @Field(() => Int, { nullable: true })
  limit: number;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String, { nullable: true })
  academicYearId: string;

  @Field(() => String, { nullable: true })
  countryId: string;

  @Field(() => String, { nullable: true })
  enrollmentStatus: string;

  @Field(() => BusinessModelEnum, { nullable: true })
  accountType: BusinessModelEnum;

  @Field(() => Int, { nullable: true })
  gradeId: number;

  @Field(() => Int, { nullable: true })
  sectionId: number;

  @Field(() => String, { nullable: true })
  teacherId: string;

  @Field(() => BusinessStatus, { nullable: true })
  businessStatus?: BusinessStatus;

  @Field(() => IECScoreFilter, { nullable: true })
  I?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  E?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  C?: IECScoreFilter;
}
