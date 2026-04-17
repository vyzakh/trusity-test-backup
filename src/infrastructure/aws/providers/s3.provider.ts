import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const S3_CLIENT = 'S3_CLIENT';

export const s3Provider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService): S3Client => {
    const awsConfig = configService.get('aws');

    return new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
  },
  inject: [ConfigService],
};
