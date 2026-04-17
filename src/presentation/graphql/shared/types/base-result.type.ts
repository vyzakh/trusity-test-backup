import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BaseResult {
  @Field(() => Boolean, { defaultValue: true })
  success: boolean;

  @Field(() => String, { defaultValue: 'success' })
  message: string;

  @Field(() => Int, { defaultValue: 200 })
  statusCode: number;
}

@ObjectType()
export class DownloadFileResult extends BaseResult {
  @Field(() => String, { nullable: true })
  downloadUrl?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  fileType?: string;

  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => Int, { nullable: true })
  expiresIn?: number;
}
