import { Field, ObjectType } from '@nestjs/graphql';
import { PlatformUserRole, UserScope } from '@shared/enums';

@ObjectType()
export class PlatformUser {
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
  canDelete: UserScope;

  @Field(() => PlatformUserRole)
  role: PlatformUserRole;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}
