import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
class TeacherAssignedClassesInput {
  @Field(() => Int)
  gradeId: number;

  @Field(() => [Int])
  sectionIds: number[];
}

@InputType()
export class CreateTeacherInput {
  @Field(() => String, { nullable: true })
  schoolId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  contactNumber: string;

  @Field(() => [TeacherAssignedClassesInput])
  assignedClasses: TeacherAssignedClassesInput[];

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}

@InputType()
export class UpdateTeacherInput {
  @Field(() => String)
  teacherId: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  contactNumber?: string;

  @Field(() => [TeacherAssignedClassesInput], { nullable: true })
  assignedClasses: TeacherAssignedClassesInput[];
}
