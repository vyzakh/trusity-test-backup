import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExportStudentPerformanceReportResult {
  @Field({ nullable: true })
  downloadUrl: string;

  @Field(() => String, { nullable: true })
  expiresIn: string;
}
