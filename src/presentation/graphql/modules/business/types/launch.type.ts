import { ArgsType, Field, InputType } from '@nestjs/graphql';

@ArgsType()
export class GenerateLaunchRecommendationsArgs {
  @Field(() => String)
  businessId: string;
}

@InputType()
export class SaveLaunchInput {
  @Field(() => String)
  businessId: string;

  @Field(() => String)
  launchStrategy: string;
}
