import { ArgsType, Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { BusinessModelEnum, BusinessStatus, SchoolStatus, SchoolStatusAction } from '@shared/enums';
import { SortOrder } from '@shared/enums/sort-order.enum';
import { IECScoreFilter } from '../../student/dto/business-progress.args';
import { SchoolSortColumn } from '../enum/school-sort-column.enum';

registerEnumType(SchoolSortColumn, {
  name: 'SchoolSortColumn',
});

@InputType()
export class SchoolSortBy {
  @Field(() => SchoolSortColumn)
  column: SchoolSortColumn;

  @Field(() => SortOrder)
  order: SortOrder;
}

@ArgsType()
export class SchoolArgs {
  @Field(() => String, { nullable: true })
  schoolId?: string;
}

@ArgsType()
export class SchoolsArgs {
  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => BusinessModelEnum, { nullable: true })
  accountType: BusinessModelEnum;

  @Field(() => SchoolStatus, { nullable: true })
  status: SchoolStatus;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => [SchoolSortBy], { nullable: true })
  sortBy: SchoolSortBy[];

  @Field(() => String, { nullable: true })
  countryId: string;

  @Field(() => BusinessStatus, { nullable: true })
  businessStatus?: BusinessStatus;

  @Field(() => IECScoreFilter, { nullable: true })
  I?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  E?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  C?: IECScoreFilter;
}

@ArgsType()
export class TotalSchoolsArgs {
  @Field(() => BusinessModelEnum, { nullable: true })
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => SchoolStatus, { nullable: true })
  status: SchoolStatus;

  @Field(() => IECScoreFilter, { nullable: true })
  I?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  E?: IECScoreFilter;

  @Field(() => IECScoreFilter, { nullable: true })
  C?: IECScoreFilter;
}

@ArgsType()
export class ToggleSchoolActivationArgs {
  @Field(() => String)
  schoolId: string;

  @Field(() => SchoolStatusAction)
  action: SchoolStatusAction;
}

@ArgsType()
export class AcademicYearsArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String, { nullable: true })
  studentId: string;

  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}
