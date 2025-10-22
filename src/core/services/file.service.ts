import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'node:crypto';
import { fromCsvBuffer, toCsvBuffer } from '../misc';

function sanitize(buffer: Buffer): Buffer {
  const data = fromCsvBuffer(buffer);

  const [header, ...rows] = data;

  const normalizedHeader = header.map((x) =>
    x
      .split('.')[0]
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^-+|-+$/g, ''),
  );

  const normalizedRows = rows.map((row) =>
    row.map((cell) =>
      cell.startsWith('€') ? cell.replace('€', '').replace(',', '') : cell,
    ),
  );

  const result = toCsvBuffer(normalizedHeader, normalizedRows);

  return result;
}

export async function upload(
  buffer: Buffer,
  contentType: string,
): Promise<{ hash: string; url: string }> {
  const bufferSanitized = sanitize(buffer);

  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  const hash: string = crypto
    .createHash('md5')
    .update(bufferSanitized)
    .digest('hex');

  await s3Client.send(
    new PutObjectCommand({
      ACL: 'public-read',
      Body: bufferSanitized,
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
