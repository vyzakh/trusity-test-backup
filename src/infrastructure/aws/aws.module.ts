import { Module } from '@nestjs/common';
import { s3Provider } from './providers/s3.provider';
import { S3Service } from './services/s3.service';

@Module({
  providers: [s3Provider, S3Service],
  exports: [s3Provider, S3Service],
})
export class AwsModule {}
