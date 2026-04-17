import { Field, InputType } from '@nestjs/graphql';

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

  @Field(() => [String])
  schoolSectionIds: string[];

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}
