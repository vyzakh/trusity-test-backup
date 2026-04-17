import { Field, ObjectType } from '@nestjs/graphql';

// @ObjectType()
// export class StartupTerminologiesItems {
//   @Field(() => String, {nullable: true})
//   name: string;

//   @Field(() => String, {nullable: true})
//   icon: string;

//   @Field(() => String, {nullable: true})
//   definition: string;

//   @Field(() => String, {nullable: true})
//   example: string;
// }

// @ObjectType()
// export class StartupTerminologies {
//   @Field(() => String)
//   category: string;

//   @Field(() => [StartupTerminologiesItems])
//   data: StartupTerminologiesItems[];
// }

@ObjectType()
export class StartupTerminologies {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  icon: string;

  @Field(() => String, { nullable: true })
  definition: string;

  @Field(() => String, { nullable: true })
  example: string;
}
