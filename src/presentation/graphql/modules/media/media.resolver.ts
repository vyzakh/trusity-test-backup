import { UploadFileUseCase } from '@application/modules/media/use-cases/upload-file.use-case';
import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, IsPrivate } from '@shared/decorators';
import { UploadFileInput } from './dto/upload-file-input.dto';
import { UploadFileResult } from './types/upload-file-result.type';

@Resolver()
export class MediaResolver {
  constructor(private readonly s3Service: S3Service) {}

  @Mutation(() => UploadFileResult)
  @IsPrivate()
  async uploadFile(@Args('input') input: UploadFileInput, @CurrentUser() user: ICurrentUser) {
    const useCase = new UploadFileUseCase(this.s3Service);

    const data = await useCase.execute({
      data: input,
      user,
    });

    return { file: data };
  }
}
