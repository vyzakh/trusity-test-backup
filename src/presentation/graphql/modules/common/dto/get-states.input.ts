import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetStatesArgs {
  @Field(() => String)
  countryId: string;
}
