import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardSchoolStats {}

@ObjectType()
export class DashboardStudentStats {}

@ObjectType()
export class DashboardBusinessStats {}

@ObjectType()
export class DashboardSummary {
  @Field(() => DashboardSchoolStats, { nullable: true })
  schoolStats: DashboardSchoolStats;

  @Field(() => DashboardStudentStats, { nullable: true })
  studentStats: DashboardStudentStats;

  @Field(() => DashboardBusinessStats, { nullable: true })
  businessStats: DashboardBusinessStats;
}
