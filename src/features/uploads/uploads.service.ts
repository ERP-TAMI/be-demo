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
  /** Internal endpoint string (e.g. http://localhost:9000) — used for S3 operations */
  private internalEndpoint: string;
  /**
   * Public endpoint string (e.g. http://192.168.1.100:9000) — used when rewriting
   * presigned URLs so LAN / external clients can access the correct host.
   * Falls back to internalEndpoint when MINIO_PUBLIC_ENDPOINT is not set.
   */
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
    // MINIO_PUBLIC_ENDPOINT is the host:port that LAN/browser clients can reach.
    // Example: http://192.168.1.100:9000  (server's LAN IP + MinIO port)
    // If not set, presigned URLs will use the internal endpoint (fine for local dev).
    this.publicEndpoint =
      this.config.get<string>('MINIO_PUBLIC_ENDPOINT') || this.internalEndpoint;

    this.s3 = new S3Client({
      endpoint: this.internalEndpoint,
      region: 'us-east-1', // MinIO ignores region but S3 SDK requires it
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO path-style access
    });

    this.logger.log(
      `MinIO client initialized → internal: ${this.internalEndpoint}/${this.bucket} | public: ${this.publicEndpoint}`,
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
   *
   * The URL host is rewritten to MINIO_PUBLIC_ENDPOINT so that browser
   * clients on the LAN (or internet) can reach the correct server.
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
    const url = await getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });

    // Rewrite internal endpoint → public endpoint (important for LAN / production)
    if (this.publicEndpoint !== this.internalEndpoint) {
      return url.replace(this.internalEndpoint, this.publicEndpoint);
    }
    return url;
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
