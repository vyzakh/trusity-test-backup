import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class CountriesArgs {
  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => String, { nullable: true })
  name: string;
}
