import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class getNotificationArgs {
  @Field(() => String)
  userId: string;
}
