import { Field, InputType, Int } from '@nestjs/graphql';
import { BusinessModelEnum } from '@shared/enums';

@InputType()
export class UpdateStudentGuardianInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@InputType()
export class UpdateStudentInput {
  @Field(() => String)
  studentId: string;

  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  dateOfBirth: string;

  @Field(() => UpdateStudentGuardianInput, { nullable: true })
  guardian: UpdateStudentGuardianInput;

  @Field(() => Int, { nullable: true })
  gradeId: number;

  @Field(() => Int, { nullable: true })
  sectionId: number;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}
