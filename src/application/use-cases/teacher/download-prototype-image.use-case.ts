import { ICurrentUser } from '@core/types';
import { S3Service } from '@infrastructure/aws/services/s3.service';
import { NotFoundException } from '@shared/execeptions';

interface DownloadFileInput {
  data: { fileKey: string };
  user: ICurrentUser;
}

export class DownloadPrototypeImageUseCase {
  constructor(private readonly dependencies: { s3Service: S3Service }) {}

  async execute(input: DownloadFileInput) {
    const { s3Service } = this.dependencies;
    const { fileKey } = input.data;

    if (!fileKey) {
      throw new NotFoundException('File key is missing.');
    }

    const metadata = await s3Service.getFileMetadata(fileKey);
    if (!metadata) {
      throw new NotFoundException('File not found on S3.');
    }
    const fileName = fileKey.split('/').pop() || 'download';

    const { downloadUrl, expiresIn } = await s3Service.generateS3DownloadUrl({
      key: fileKey,
      expiresIn: 300,
      fileName,
    });

    return {
      fileName: fileKey.split('/').pop(),
      fileUrl: metadata.fileUrl,
      downloadUrl,
      expiresIn,
    };
  }
}
