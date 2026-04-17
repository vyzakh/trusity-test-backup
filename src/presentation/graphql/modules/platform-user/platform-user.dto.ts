import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreatePlatformUserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  contactNumber: string;
}

@InputType()
export class AssignPermissionsToPlatformUserInput {
  @Field()
  platformUserId: string;

  @Field(() => [Int], { nullable: true })
  permissionIds: number[];
}
