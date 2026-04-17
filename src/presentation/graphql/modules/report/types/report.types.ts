import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { BusinessStatus } from '@shared/enums';

@ArgsType()
export class ExportClassLevelReportArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Int)
  gradeId: number;

  @Field(() => Int)
  sectionId: number;

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;

  @Field(() => String)
  feedbackId: string;
}

@ArgsType()
export class ExportGradeLevelReportArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => [Int])
  gradeIds: number[];

  @Field(() => [Int], { nullable: true })
  sectionIds: number[];

  @Field(() => BusinessStatus, { nullable: true })
  status: BusinessStatus;

  @Field(() => String)
  feedbackId: string;
}

@ArgsType()
export class SendStudentPerfomanceReportArgs {
  @Field(() => String)
  studentId: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  feedbackId: string;

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}

@InputType()
export class ExportStudentPerformanceReportInput {
  @Field(() => String, { nullable: true })
  studentId: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  feedbackId: string;

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}
