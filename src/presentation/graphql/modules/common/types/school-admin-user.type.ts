import { Field, ObjectType } from '@nestjs/graphql';
import { UserScope } from '@shared/enums';

@ObjectType()
export class SchoolAdminUser {
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

  @Field(() => Boolean)
  isPrimary: boolean;

  @Field(() => String)
  schoolId: string;
}

@ObjectType()
export class SchoolAdmin {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userAccountId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;

  @Field(() => UserScope)
  scope: UserScope;

  @Field(() => Boolean)
  isPrimary: boolean;

  @Field(() => String)
  schoolId: string;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field(() => String, { nullable: true })
  currentSchoolAYId: string;
}
