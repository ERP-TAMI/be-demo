import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://127.0.0.1:9000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  forcePathStyle: true,
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: 'erp-files' }));
    console.log('✅ Bucket erp-files already exists');
  } catch (e) {
    console.log('Creating bucket...', e.name, e.$metadata?.httpStatusCode);
    await s3.send(new CreateBucketCommand({ Bucket: 'erp-files' }));
    console.log('✅ Created bucket: erp-files');
  }
}

ensureBucket().catch(console.error);
