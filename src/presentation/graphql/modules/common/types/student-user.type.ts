import { Field, ObjectType } from '@nestjs/graphql';
import { BusinessModelEnum, UserScope } from '@shared/enums';

@ObjectType()
export class StudentUser {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userAccountId: string;

  @Field(() => String)
  name: string;

  @Field(() => BusinessModelEnum)
  accountType: BusinessModelEnum;

  @Field(() => String)
  email: string;

  @Field(() => UserScope)
  scope: UserScope;

  @Field(() => String)
  schoolId: string;

  gradeAsText: string | null;
  sectionAsText: string | null;
}
