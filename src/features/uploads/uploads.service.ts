import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface UploadResult {
  fileKey: string; // Cloudinary public_id
  fileUrl: string; // Cloudinary secure_url
  fileName: string; // Original filename
  sizeMb: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
    this.logger.log('Cloudinary initialized for file uploads');
  }

  /**
   * Upload a file buffer to Cloudinary.
   * @param folder  e.g. "po-files", "line-files", "sample-images"
   * @param originalName  original filename from client
   * @param buffer  file content
   * @param mimeType  MIME type (used for logging only)
   */
  async uploadFile(
    folder: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const ext = extname(originalName);
    const publicId = `${folder}/${randomUUID()}${ext}`;
    const sizeMb = buffer.byteLength / 1_048_576;

    const secureUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: 'auto', overwrite: true },
        (error, result) => {
          if (error || !result?.secure_url) {
            return reject(error ?? new Error('No secure_url from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(stream);
    });

    this.logger.log(
      `Uploaded: ${publicId} (${sizeMb.toFixed(2)} MB) [${mimeType}]`,
    );

    return {
      fileKey: publicId,
      fileUrl: secureUrl,
      fileName: originalName,
      sizeMb: parseFloat(sizeMb.toFixed(3)),
    };
  }

  /**
   * Get URL for a file. If already a full URL (Cloudinary), returns as-is.
   * Signature kept for backwards-compatibility with callers.
   */
  async getPresignedUrl(
    fileKey: string,
    _expiresInSeconds = 604800,
  ): Promise<string> {
    if (fileKey.startsWith('http')) return fileKey;
    const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const ext = extname(fileKey).toLowerCase();
    const resourceType = IMAGE_EXTS.includes(ext) ? 'image' : 'raw';
    return cloudinary.url(fileKey, { resource_type: resourceType, secure: true });
  }

  /**
   * Delete a file from Cloudinary.
   */
  async deleteFile(fileKey: string): Promise<void> {
    await cloudinary.uploader.destroy(fileKey, { resource_type: 'raw' });
    this.logger.log(`Deleted: ${fileKey}`);
  }
}
