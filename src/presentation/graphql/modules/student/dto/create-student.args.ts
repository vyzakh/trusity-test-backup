import { Field, InputType, Int } from '@nestjs/graphql';
import { BusinessModelEnum } from '@shared/enums';

@InputType()
export class CreateStudentGuardianInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@InputType()
export class CreateStudentInput {
  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => String, { nullable: true })
  dateOfBirth: string;

  @Field(() => CreateStudentGuardianInput, { nullable: true })
  guardian: CreateStudentGuardianInput;

  @Field(() => Int)
  gradeId: number;

  @Field(() => Int)
  sectionId: number;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}
