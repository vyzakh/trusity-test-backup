import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ObjectCannedACL, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { S3_CLIENT } from '../providers/s3.provider';

@Injectable()
export class S3Service {
  private bucket: string;
  private region: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('aws.s3.bucket')!;
    this.region = this.configService.get<string>('aws.region')!;
  }

  async generateS3PreSignedUrl(options: {
    key: string;
    contentType: string;
    acl?: ObjectCannedACL;
    expiresIn?: number;
  }): Promise<{ uploadUrl: string; fileUrl: string; expiresIn: number }> {
    const { key, contentType, acl = 'private', expiresIn = 3600 } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      ContentType: contentType,
      Key: key,
      ACL: acl,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, expiresIn };
  }

  async getFileMetadata(key: string) {
    try {
      const metadata = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return { ...metadata, fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}` };
    } catch {
      return null;
    }
  }

  async getFilesMetadata(keys: string[]): Promise<any[]> {
    const results: any[] = [];
    for (const key of keys) {
      const meta = await this.getFileMetadata(key);
      if (meta) results.push(meta);
    }
    return results;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async uploadFile(options: { key: string; body: Buffer | Uint8Array | Blob | string; contentType: string; acl: ObjectCannedACL }): Promise<{ fileUrl: string; key: string }> {
    const { key, body, contentType, acl } = options;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: acl,
      }),
    );
    return {
      fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      key: key,
    };
  }

  async getFile(key: string): Promise<{ fileUrl: string; buffer?: Buffer; stream?: Readable } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      const stream = response.Body as Readable;

      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      return {
        fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        buffer,
        stream,
      };
    } catch (err) {
      return null;
    }
  }

  async generateS3DownloadUrl(options: { key: string; expiresIn?: number; fileName?: string }): Promise<{ downloadUrl: string; expiresIn: number }> {
    const { key, expiresIn = 300 } = options;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: 'attachment',
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return { downloadUrl, expiresIn };
  }
}
