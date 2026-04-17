import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class ExportBusinessModelCanvasArgs {
  @Field(() => Int)
  businessId: String;
}
