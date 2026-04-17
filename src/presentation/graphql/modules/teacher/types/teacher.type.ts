import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { UserScope } from '@shared/enums';
import { BusinessPhaseStepEnum } from '@shared/enums/business-phase-step.enum';
import { Grade, Section } from '../../common/types';

@ObjectType()
export class Teacher {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userAccountId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => UserScope)
  scope: UserScope;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field(() => String, { nullable: true })
  currentSchoolAYId: string;

  schoolId: string;
  schoolSectionIds: string[];
  schoolGradeIds: string[];
}

@ObjectType()
export class TeacherGrade {
  @Field(() => Grade)
  grade: Grade;

  schoolId: string;
  teacherId: string;
}

@ObjectType()
export class TeacherSection {
  @Field(() => Section)
  section: Section;

  schoolId: string;
  gradeId: number;
}

@ObjectType()
export class CreateTeacherResult extends BaseResult {
  @Field(() => Teacher, { nullable: true })
  teacher: Teacher;
}

@ObjectType()
export class UpdateTeacherResult extends BaseResult {
  @Field(() => Teacher, { nullable: true })
  teacher: Teacher;
}

@ObjectType()
export class DeleteTeacherResult extends BaseResult {
  @Field(() => Teacher, { nullable: true })
  teacher: Teacher;
}

@ObjectType()
export class BusinessStepFeedback {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  businessId: string;

  @Field(() => BusinessPhaseStepEnum, { nullable: true })
  businessStep: BusinessPhaseStepEnum;

  @Field(() => String)
  teacherId: string;

  @Field(() => String)
  feedback: string;

  @Field(() => [String], { nullable: true })
  fileUrl?: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Teacher, { nullable: true })
  teacher?: Teacher;
}

@ObjectType()
export class DeleteFeedbackResult extends BaseResult {
  @Field(() => BusinessStepFeedback, { nullable: true })
  feedback: BusinessStepFeedback;
}
@ObjectType()
export class CreateFeedbackResult extends BaseResult {
  @Field(() => BusinessStepFeedback, { nullable: true })
  feedback: BusinessStepFeedback;
}

@ObjectType()
export class UpdateFeedbackResult extends BaseResult {
  @Field(() => BusinessStepFeedback, { nullable: true })
  feedback: BusinessStepFeedback;
}
@ObjectType()
export class DownloadResult extends BaseResult {
  @Field({ nullable: true })
  fileName?: string;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  downloadUrl?: string;

  @Field(() => String, { nullable: true })
  expiresIn?: string;
}
