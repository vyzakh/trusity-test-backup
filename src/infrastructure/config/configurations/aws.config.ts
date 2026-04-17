import { registerAs } from '@nestjs/config';

export const awsConfig = registerAs('aws', () => {
  return {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3: {
      bucket: process.env.S3_BUCKET!,
    },
  };
});
