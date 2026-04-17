import { Field, InputType } from '@nestjs/graphql';
import { FileType } from '@shared/enums/file-types.enum';

@InputType()
export class UploadFileInput {
  @Field(() => String)
  fileName: string;

  @Field(() => FileType)
  fileType: FileType;

  @Field(() => String)
  mimeType: string;
}
