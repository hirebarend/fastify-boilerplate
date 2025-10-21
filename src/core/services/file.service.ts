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

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (/^€\d{1,3}(?:,\s?\d{3})*\.\d{2}$/.test(rows[y][x])) {
        rows[y][x] = parseFloat(rows[y][x].replace(/[€, ]/g, '')).toString();
      }
    }
  }

  const result = Buffer.from(
    [
      header.join(','),
      ...rows.map((row) =>
        row
          .map((column) =>
            column.includes(',') || column.includes('"')
              ? `"${column.replace(/\"/g, '\\"')}"`
              : column,
          )
          .join(','),
      ),
    ].join('\n'),
  );

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
