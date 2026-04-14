import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:9000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  forcePathStyle: true,
});

const bucket = 'erp-files';

async function configureCors() {
  try {
    const corsConfig = {
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH'],
            AllowedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
            ExposedHeaders: ['ETag', 'x-amz-request-id', 'x-amz-id-2'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    await s3.send(new PutBucketCorsCommand(corsConfig));
    console.log(`✅ Successfully configured CORS for bucket: ${bucket}`);
  } catch (error) {
    console.error('❌ Error configuring CORS:', error);
  }
}

configureCors();
