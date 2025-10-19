import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { DuckDBConnection } from '@duckdb/node-api';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { File, getContainer } from '../core';

export const FILES_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Buffer;
      Querystring: { name: string; sessionId: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { faker } = await import('@faker-js/faker');

    const container = await getContainer();

    const s3Client = new S3Client({ region: process.env.AWS_REGION });

    const hash: string = crypto
      .createHash('md5')
      .update(request.body)
      .digest('hex');

    await s3Client.send(
      new PutObjectCommand({
        ACL: 'public-read',
        Body: request.body,
        Bucket: process.env.AWS_S3_BUCKET,
        ContentType:
          request.headers['content-type'] || 'application/octet-stream',
        Key: hash,
      }),
    );

    const connection = await DuckDBConnection.create();

    const readerResult = await connection.runAndReadAll(
      `SELECT COUNT(*) FROM read_csv_auto('${`https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`}', header=true)`,
    );

    const rows = readerResult.getRowsJson();

    connection.closeSync();

    const file: File = {
      contentType:
        request.headers['content-type'] || 'application/octet-stream',
      hash,
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      metadata: {
        columns: [],
        count: rows[0][0] as number,
      },
      name: request.query.name,
      session: {
        id: request.query.sessionId,
      },
      size: request.body.length || 0,
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`,
    };

    await container.db.collection<File>('files').insertOne(file);

    reply.status(200).send(file);
  },
  method: 'POST',
  url: '/api/v1/files',
  schema: {
    tags: ['X-HIDDEN'],
    querystring: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
        },
      },
    },
  },
};
