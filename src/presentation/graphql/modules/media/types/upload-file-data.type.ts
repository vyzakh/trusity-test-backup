import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadFileData {
  @Field(() => String)
  uploadUrl: string;

  @Field(() => String)
  fileUrl: string;

  @Field(() => String)
  fileKey: string;

  @Field(() => Int)
  expiresIn: number;
}
