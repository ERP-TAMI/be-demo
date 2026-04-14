import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface UploadResult {
  fileKey: string; // Storage key (path in bucket)
  fileUrl: string; // Public/presigned URL
  fileName: string; // Original filename
  sizeMb: number;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get<number>('MINIO_PORT', 9000);
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY', 'minioadmin');
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'erp-files');

    this.s3 = new S3Client({
      endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1', // MinIO ignores region but S3 SDK requires it
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO path-style access
    });

    this.logger.log(
      `MinIO client initialized → ${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${this.bucket}`,
    );
  }

  /**
   * Upload a file buffer to MinIO/S3.
   * @param folder  e.g. "po-files", "line-files", "sample-images"
   * @param originalName  original filename from client
   * @param buffer  file content
   * @param mimeType  MIME type
   */
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

    const fileUrl = await this.getPresignedUrl(fileKey, 60 * 60 * 24 * 7); // 7 days

    this.logger.log(`Uploaded: ${fileKey} (${sizeMb.toFixed(2)} MB)`);

    return {
      fileKey,
      fileUrl,
      fileName: originalName,
      sizeMb: parseFloat(sizeMb.toFixed(3)),
    };
  }

  /**
   * Generate a presigned GET URL (default 7 days).
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
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
  }

  /**
   * Delete a file from MinIO/S3.
   */
  async deleteFile(fileKey: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
    );
    this.logger.log(`Deleted: ${fileKey}`);
  }
}
