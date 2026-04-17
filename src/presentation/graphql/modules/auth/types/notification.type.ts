import { ObjectType, Field, Int, ArgsType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class Notification {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  message: string;

 @Field(() => GraphQLJSON, { nullable: true })
  data?: any; 

  @Field(() => Int)
  createdBy: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  readAt?: Date | null;
}

@ArgsType()
export class ReadNotificationsInput {
  @Field(() => [String])
  read: string[];
}
