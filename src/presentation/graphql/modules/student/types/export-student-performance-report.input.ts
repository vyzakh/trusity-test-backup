import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ExportStudentPerformanceReportInput {
  @Field(() => String, { nullable: true })
  studentId: string;

  @Field(() => String)
  businessId: string;

  @Field(() => String)
  feedbackId: string;
}
