import { Field, ObjectType } from '@nestjs/graphql';
import { UserScope } from '@shared/enums';

@ObjectType()
export class TeacherUser {
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

  @Field(() => String)
  schoolId: string;
}
