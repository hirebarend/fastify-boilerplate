import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'node:crypto';

export async function upload(
  buffer: Buffer,
  contentType: string,
): Promise<{ hash: string; url: string }> {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  const hash: string = crypto.createHash('md5').update(buffer).digest('hex');

  await s3Client.send(
    new PutObjectCommand({
      ACL: 'public-read',
      Body: buffer,
      Bucket: process.env.AWS_S3_BUCKET,
      ContentType: contentType,
      Key: hash,
    }),
  );

  return {
    hash,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`,
  };
}
