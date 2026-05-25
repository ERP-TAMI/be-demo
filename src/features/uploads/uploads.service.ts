import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface UploadResult {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  sizeMb: number;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private s3: S3Client;
  /** s3Public: dung de sign presigned URL voi dung publicEndpoint */
  private s3Public: S3Client;
  private bucket: string;
  private internalEndpoint: string;
  private publicEndpoint: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get<number>('MINIO_PORT', 9000);
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY', 'minioadmin');
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'erp-files');

    this.internalEndpoint = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    this.publicEndpoint =
      this.config.get<string>('MINIO_PUBLIC_ENDPOINT') || this.internalEndpoint;

    // S3Client noi bo - dung cho upload/delete
    this.s3 = new S3Client({
      endpoint: this.internalEndpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });

    // S3Client public - sign presigned URL voi dung host public
    // Browser goi dung host -> chu ky khop -> khong bi 403
    this.s3Public = new S3Client({
      endpoint: this.publicEndpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true,
    });

    this.logger.log(
      `MinIO client initialized -> internal: ${this.internalEndpoint}/${this.bucket} | public: ${this.publicEndpoint}`,
    );

    this.ensureBucket().catch((e) =>
      this.logger.error(`Failed to ensure bucket: ${e.message}`),
    );
  }

  private async ensureBucket() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" already exists`);
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" created`);
    }
  }

  async uploadFile(
    folder: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const ext = extname(originalName);
    const fileKey = `${folder}/${randomUUID()}${ext}`;
    const sizeMb = buffer.byteLength / 1_048_576;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
        ContentDisposition: `inline; filename="${encodeURIComponent(originalName)}"`,
      }),
    );

    const fileUrl = await this.getPresignedUrl(fileKey, 60 * 60 * 24 * 7);

    this.logger.log(`Uploaded: ${fileKey} (${sizeMb.toFixed(2)} MB)`);

    return {
      fileKey,
      fileUrl,
      fileName: originalName,
      sizeMb: parseFloat(sizeMb.toFixed(3)),
    };
  }

  /**
   * Generate presigned URL dung s3Public.
   * Chu ky duoc tao voi publicEndpoint -> browser truy cap dung host -> 200 OK
   */
  async getPresignedUrl(
    fileKey: string,
    expiresInSeconds = 604800,
  ): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ResponseContentDisposition: 'inline',
      ResponseCacheControl: 'public, max-age=3600',
    });
    return getSignedUrl(this.s3Public, cmd, { expiresIn: expiresInSeconds });
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
    );
    this.logger.log(`Deleted: ${fileKey}`);
  }
}
