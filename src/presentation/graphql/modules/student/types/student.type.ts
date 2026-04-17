import { ArgsType, Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { BusinessModelEnum, UserScope } from '@shared/enums';

@ObjectType()
export class StudentBusinessStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  completed: number;

  @Field(() => Int)
  inProgress: number;
}

@ObjectType()
export class StudentChallengeStats {
  @Field(() => Int)
  assigned: number;

  @Field(() => Int)
  completed: number;

  @Field(() => Int)
  inProgress: number;
}

@ObjectType()
export class StudentGuardian {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@ObjectType()
export class Student {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => UserScope)
  scope: UserScope;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String)
  userAccountId: string;

  @Field(() => String, { nullable: true })
  currentAYId: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  dateOfBirth: Date;

  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => StudentGuardian, { nullable: true })
  guardian: StudentGuardian;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field(() => String, { nullable: true })
  enrollmentStatus: string;

  schoolId: string;
  gradeId: number | null | undefined;
  sectionId: number | null | undefined;

  gradeAsText: string | null;
  sectionAsText: string | null;
  totalAvgScore: number;
}

@ObjectType()
export class CreateStudentResult extends BaseResult {
  @Field(() => Student)
  student: Student;
}

@ObjectType()
export class BulkUploadStudentsResult extends BaseResult {
  @Field(() => [Student])
  students: Student[];
}

@ObjectType()
export class UpdateStudentResult extends BaseResult {
  @Field(() => Student, { nullable: true })
  student: Student;
}

@ObjectType()
export class DeleteStudentResult extends BaseResult {}

@ArgsType()
export class AssignedChallengesArgs {
  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@InputType()
export class BulkUploadStudentsInput {
  @Field(() => String)
  fileKey: string;

  @Field(() => String, { nullable: true })
  schoolId: string;
}

@InputType()
export class DemoteStudentsInput {
  @Field(() => [String])
  studentIds: string[];
}

@ObjectType()
export class OverallBusinessReport {
  @Field(() => String)
  high_i: string;

  @Field(() => String)
  low_i: string;

  @Field(() => String)
  avg_i: string;

  @Field(() => String)
  impact_i: string;

  @Field(() => String)
  high_e: string;

  @Field(() => String)
  low_e: string;

  @Field(() => String)
  avg_e: string;

  @Field(() => String)
  impact_e: string;

  @Field(() => String)
  high_c: string;

  @Field(() => String)
  low_c: string;

  @Field(() => String)
  avg_c: string;

  @Field(() => String)
  impact_c: string;
}

@ObjectType()
export class StudentAcademicHistory {
  @Field(() => GraphQLISODateTime)
  enrollmentDate: Date;

  schoolId: string;
  academicYearId: string;
  gradeId: number;
  sectionId: number;
  studentId: string;
  enrollmentStatusId: number;
}
