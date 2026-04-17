import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResult } from '@presentation/graphql/shared/types/base-result.type';
import { UploadFileData } from './upload-file-data.type';

@ObjectType()
export class UploadFileResult extends BaseResult {
  @Field(() => UploadFileData, { nullable: true })
  file: UploadFileData;
}
