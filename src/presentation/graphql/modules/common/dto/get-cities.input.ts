import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetCitiesArgs {
  @Field(() => String)
  stateId: string;
}
