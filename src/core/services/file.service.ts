import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'node:crypto';

function parseCsv(content: string): Array<Array<string>> {
  const rows: Array<Array<string>> = [];

  let row: Array<string> = [];

  let field = '';

  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];

    const next = content[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (c === '\n' || c === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function sanitize(buffer: Buffer): Buffer {
  const content = buffer.toString();

  const lines = parseCsv(content);

  const header = lines[0];

  const rows = lines.slice(1);

  return buffer;
}

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
