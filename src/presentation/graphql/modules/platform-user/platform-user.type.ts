import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';
import { LoggedInUserUnion } from '../auth/types';
import { PlatformUser } from '../common/types';

@ObjectType()
export class CreatePlatformUserResult extends BaseResult {
  @Field(() => PlatformUser)
  platformUser: PlatformUser;
}

@ObjectType()
export class AssignPermissionsToPlatformUserResult extends BaseResult {}

@ArgsType()
export class PlatformUsersArgs {
  @Field(() => Int, { nullable: true })
  offset: number;

  @Field(() => Int, { nullable: true })
  limit: number;

  @Field(() => String, { nullable: true })
  name: string;
}

@ArgsType()
export abstract class TotalPlatformUsersArgs {
  @Field(() => String, { nullable: true })
  name: string;
}

@ArgsType()
export class PlatformUserArgs {
  @Field(() => String)
  platformUserId: number;
}

@InputType()
export class DeletePlatformUserInput {
  @Field(() => String)
  platformUserId: string;
}

@ObjectType()
export class DeletePlatformUserResult extends BaseResult {}

@InputType()
export class UpdatePlatformUserInput {
  @Field(() => String, { nullable: true })
  platformUserId?: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@ObjectType()
export class UpdatePlatformUserResult extends BaseResult {
  @Field(() => PlatformUser, { nullable: true })
  platformUser: PlatformUser;
}

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  contactNumber?: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;
}

@ObjectType()
export class UpdateProfileResult extends BaseResult {
  @Field(() => LoggedInUserUnion, { nullable: true })
  profile: typeof LoggedInUserUnion;
}
