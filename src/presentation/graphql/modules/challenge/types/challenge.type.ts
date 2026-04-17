import { createUnionType, Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { ChallengeCreatorType, ChallengeScope, ChallengeVisibility } from '@shared/enums';
import { Grade, Section, PlatformUser } from '../../common/types';
import { SchoolAdmin } from '../../common/types/school-admin-user.type';
import { School, SchoolGrade, SchoolSection } from '../../school/types';
import { Student } from '../../student/types';
import { Teacher } from '../../teacher/types';

@ObjectType()
export class ChallengeTargetGrade {
  @Field(() => Grade)
  grade: Grade;

  challengeId: string;
  schoolId: string;
  studentId: string;
}

@ObjectType()
export class ChallengeTargetSection {
  @Field(() => Section)
  section: Section;

  gradeId: number;
  challengeId: string;
  schoolId: string;
  studentId: string;
}

@ObjectType()
export class ChallengeTargetStudent {
  @Field(() => Student)
  student: Student;

  challengeId: string;
  schoolId: string;
  studentId: string;
}

@ObjectType()
export class Challenge {
  @Field(() => String)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  companyName: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => ChallengeVisibility)
  visibility: ChallengeVisibility;

  @Field(() => String, { nullable: true })
  expectation: string;

  @Field(() => ChallengeScope)
  scope: ChallengeScope;

  @Field(() => ChallengeCreatorType)
  creatorType: ChallengeCreatorType;

  @Field(() => String, { nullable: true })
  logoUrl: string;

  @Field(() => String)
  academicYearId: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

  sectorId: number;
  createdBy: string;
  schoolId: string;
}

@ObjectType()
export class AssignedChallenge {
  @Field(() => Challenge)
  challenge: Challenge;

  @Field(() => Date)
  startAt: Date;

  @Field(() => Date)
  endAt: Date;
}


@ObjectType()
export class ChallengeAssignationInfo {
  @Field(() => Date)
  startAt: Date;

  @Field(() => Date)
  endAt: Date;
}

@ObjectType()
export class ChallengeAssignment {
  @Field(() => Student)
  student: Student;

  @Field(() => GraphQLISODateTime)
  startAt: Date;

  @Field(() => GraphQLISODateTime)
  endAt: Date;
}

export const ChallengeCreatedByUnion = createUnionType({
  name: 'ChallengeCreatedByUnion',
  types: () => [PlatformUser, SchoolAdmin, Teacher] as const,
  resolveType(value) {
    switch (value.scope) {
      case ChallengeCreatorType.PLATFORM_USER: {
        return PlatformUser;
      }
      case ChallengeCreatorType.SCHOOL_ADMIN: {
        return SchoolAdmin;
      }
      case ChallengeCreatorType.TEACHER: {
        return Teacher;
      }
    }
  },
});

@ObjectType()
export class CreateChallengeResult extends BaseResult {
  @Field(() => Challenge)
  challenge: Challenge;
}

@ObjectType()
export class AssignChallengeResult extends BaseResult {}

@ObjectType()
export class ChallengeAssignedSchool {
  @Field(() => School)
  school: School;

  challengeId: string;
}

@ObjectType()
export class ChallengeAssignedSchoolGrade {
  @Field(() => SchoolGrade)
  schoolGrade: SchoolGrade;

  schoolId: string;
  challengeId: string;
}

@ObjectType()
export class ChallengeAssignedSchoolSection {
  @Field(() => SchoolSection)
  schoolSection: SchoolSection;

  @Field(() => Boolean)
  isEntire: boolean;

  schoolId: string;
  challengeId: string;
}

@ObjectType()
export class ChallengeStudentStats {
  @Field(() => Int)
  totalAssigned: number;

  @Field(() => Int)
  completed: number;

  @Field(() => Int)
  inProgress: number;
}

@InputType()
export class HideChallengeInput {
  @Field(() => String)
  challengeId: string;

  @Field(() => Boolean)
  hidden: boolean;
}
