import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import duckdb, { DuckDBConnection } from '@duckdb/node-api';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, Query } from '../core';

function normalizeFilename(str: string): string {
  const strSplitted = str.split('.');

  return strSplitted[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SESSIONS_ID_QUERY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { query: string };
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { faker } = await import('@faker-js/faker');

    const container = await getContainer();

    const connection = await DuckDBConnection.create();

    const files = [
      {
        name: 'weather.csv',
        url: 'https://www.stats.govt.nz/assets/Uploads/Annual-enterprise-survey/Annual-enterprise-survey-2024-financial-year-provisional/Download-data/annual-enterprise-survey-2024-financial-year-provisional.csv',
      },
    ];

    // const files = await container.db
    //   .collection('files')
    //   .find({
    //     'session.id': request.params.id,
    //   })
    //   .toArray();

    for (const file of files) {
      await connection.run(`
        CREATE TEMP VIEW "${normalizeFilename(file.name)}" AS
        SELECT * FROM read_csv_auto('${file.url}', header=true)
      `);
    }

    const start = new Date().getTime();
    const readerResult = await connection.runAndReadAll(request.body.query);
    const end = new Date().getTime();
    const elapsed = end - start;

    const columns = readerResult.columnNames();

    const rows = readerResult.getRowsJson();

    connection.closeSync();

    const buffer = Buffer.from(
      [columns.join(','), ...rows.map((row) => row.join(','))].join('\n'),
    );

    const s3Client = new S3Client({ region: process.env.AWS_REGION });

    const hash: string = crypto.createHash('md5').update(buffer).digest('hex');

    await s3Client.send(
      new PutObjectCommand({
        ACL: 'public-read',
        Body: buffer,
        Bucket: process.env.AWS_S3_BUCKET,
        ContentType: 'text/csv',
        Key: hash,
      }),
    );

    const query: Query = {
      contentType: 'text/csv',
      hash,
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      metadata: {
        columns,
        count: rows.length,
        elapsed,
      },
      name: '',
      query: request.body.query,
      session: {
        id: request.params.id,
      },
      size: buffer.length,
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`,
    };

    await container.db.collection<Query>('queries').insertOne(query);

    reply.status(200).send({
      ...query,
      rows,
    });
  },
  method: 'POST',
  url: '/api/v1/sessions/:id/query',
  schema: {
    tags: ['sessions'],
    // Uncomment the following lines to enforce authentication
    // security: [
    //   {
    //     apiKey: [],
    //   },
    // ],
    body: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
        },
      },
    },
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    },
  },
};
