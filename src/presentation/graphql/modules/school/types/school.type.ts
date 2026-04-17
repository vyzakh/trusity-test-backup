import { ArgsType, Field, Float, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { BusinessStatus } from '@shared/enums';
import { BusinessModelEnum } from '@shared/enums/business-model.enum';
import { Curriculum, Grade, Section } from '../../common/types';

@ObjectType()
export class BusinessPhaseAverageScore {
  @Field(() => Float, { nullable: true })
  avgInnovationScore: number;

  @Field(() => Float, { nullable: true })
  avgEntrepreneurshipScore: number;

  @Field(() => Float, { nullable: true })
  avgCommunicationScore: number;
}

@ObjectType()
export class SchoolStats {
  @Field(() => Int, { nullable: true })
  totalStudents: number;

  @Field(() => Int, { nullable: true })
  totalTeachers: number;

  @Field(() => Int, { nullable: true })
  totalSections: number;

  @Field(() => Int, { nullable: true })
  totalGrades: number;
}

@ObjectType()
export class SchoolAddress {
  @Field(() => String, { nullable: true })
  streetAddressLine1: string;

  @Field(() => String, { nullable: true })
  streetAddressLine2: string;

  @Field(() => String, { nullable: true })
  postalCode: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
}

@ObjectType()
export class SchoolContact {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  email: string;
}

@ObjectType()
export class SchoolCarriculum extends Curriculum {
  @Field(() => String, { nullable: true })
  otherName?: string | null;
}

@ObjectType()
export class SchoolGrade {
  @Field(() => Grade)
  grade: Grade;

  schoolId: string;
}

@ObjectType()
export class SchoolSection {
  @Field(() => Section)
  section: Section;

  schoolId: string;
  gradeId: number;
}

@ObjectType()
export class School {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  currentAYId: string;

  @Field(() => Int, { nullable: true })
  academicBaseYear: number;

  @Field(() => Int, { nullable: true })
  academicStartMonth: number;

  @Field(() => Int, { nullable: true })
  academicEndMonth: number;

  @Field(() => Int, { nullable: true })
  promotionStartMonth: number;

  @Field(() => Int, { nullable: true })
  promotionStartDay: number;

  @Field(() => SchoolAddress, { nullable: true })
  address: SchoolAddress;

  @Field(() => SchoolContact, { nullable: true })
  contact: SchoolContact;

  @Field(() => String, { nullable: true })
  principalName: string;

  @Field(() => Int, { nullable: true })
  totalLicense: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  licenseExpiry: Date;

  @Field(() => String, { nullable: true })
  logoUrl: string;

  @Field(() => [String], { nullable: true })
  promotionErrors: string[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  promotionCompletedAt: Date;

  @Field(() => Int, { nullable: true })
  lastPromotionYear: number;

  @Field(() => Boolean, { nullable: true })
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class CreateSchoolResult extends BaseResult {
  @Field(() => School, { nullable: true })
  school: School;
}

@ObjectType()
export class UpdateSchoolResult extends BaseResult {
  @Field(() => School, { nullable: true })
  school: School;
}

@ObjectType()
export class CreateSchoolGradeResult extends BaseResult {}

@ObjectType()
export class UpdateSchoolGradeResult extends BaseResult {}

@ObjectType()
export class DeleteSchoolGradeResult extends BaseResult {}

@ObjectType()
export class ToggleSchoolActivationResult extends BaseResult {}

@InputType()
export class PromoteSchoolInput {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => Boolean, { nullable: true })
  forcePromotion?: boolean;
}

@ObjectType()
export class ClassPerformanceScore {
  @Field(() => Float)
  cis: number;

  @Field(() => Float)
  ces: number;

  @Field(() => Float)
  ccs: number;
}

@ObjectType()
export class GradePerformanceScore {
  @Field(() => Float)
  gis: number;

  @Field(() => Float)
  ges: number;

  @Field(() => Float)
  gcs: number;
}

@ObjectType()
export class PerformanceProgression {
  @Field(() => Float)
  problemStatement: number;

  @Field(() => Float)
  marketResearch: number;

  @Field(() => Float)
  marketFit: number;

  @Field(() => Float)
  prototype: number;

  @Field(() => Float)
  businessModel: number;

  @Field(() => Float)
  financialPlanning: number;

  @Field(() => Float)
  marketing: number;

  @Field(() => Float)
  pitchFeedback: number;
}

@ArgsType()
export class GradeLevelReportArgs {
  @Field(() => [Int], { nullable: true })
  sectionIds?: number[];

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}

@ArgsType()
export class GradeLevelFeedbacktArgs {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => [Int])
  gradeIds: number[];

  @Field(() => [Int], { nullable: true })
  sectionIds?: number[];

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}

@ArgsType()
export class GradeLevel2ReportArgs {
  @Field(() => [Int])
  gradeIds: number[];

  @Field(() => BusinessStatus, { nullable: true })
  status?: BusinessStatus;
}

@ObjectType()
export class AIGeneratedFeedback {
  @Field(() => String)
  feedbackId: string;

  @Field(() => String)
  feedback: string;
}
