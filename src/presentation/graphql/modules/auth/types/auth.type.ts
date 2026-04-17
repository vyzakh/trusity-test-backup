import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types';

@InputType()
export class SendPasswordResetLinkInput {
  @Field(() => String)
  email: string;
}

@InputType()
export class ResetPasswordWithTokenInput {
  @Field(() => String)
  token: string;

  @Field(() => String)
  password: string;
}

@ObjectType()
export class SendPasswordResetLinkResult extends BaseResult {}

@ObjectType()
class Message {
  @Field(() => String)
  id: string;

  @Field(() => String)
  message: string;

  @Field(() => Boolean)
  isRead: boolean;
}

@InputType()
export class NotificationInput {
  @Field(() => Int, { nullable: true })
  limit: number;

  @Field(() => Int, { nullable: true })
  offset: number;
}

@ArgsType()
export class DeleteNotificationInput {
  @Field(() => [String])
  ids: string[];
}

@ObjectType()
export class NotificationCount {
  @Field(() => Int, { nullable: true })
  count: number;

  @Field(() => Int, { nullable: true })
  unreadCount: number;
}
