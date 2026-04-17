import { ArgsType, Field, Int } from '@nestjs/graphql';
import { DeckType } from '@shared/enums/business-deck-type.enum';

@ArgsType()
export class GeneratePitchDeckArgs {
  @Field(() => String)
  businessId: string;

  @Field(() => DeckType)
  fileType: DeckType;

  @Field(() => String)
  templateCode: string;
}
