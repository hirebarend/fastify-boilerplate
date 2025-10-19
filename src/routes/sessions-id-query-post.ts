import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { DuckDBConnection } from '@duckdb/node-api';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, Query, SessionFile } from '../core';

function normalizeFilename(str: string): string {
  const strSplitted = str.split('.');

  return strSplitted[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

async function executeQuery(sessionFiles: Array<SessionFile>, query: string) {
  const connection = await DuckDBConnection.create();

  try {
    await connection.run(`INSTALL httpfs;`);
    await connection.run(`INSTALL cache_httpfs FROM community;`);
    await connection.run(`LOAD httpfs;`);
    await connection.run(`LOAD cache_httpfs;`);

    await connection.run(`PRAGMA cache_httpfs_type='on_disk';`);
    await connection.run(`PRAGMA cache_httpfs_cache_directory='./tmp';`);
    await connection.run(`PRAGMA cache_httpfs_cache_block_size=1048576;`);

    for (const sessionFile of sessionFiles) {
      try {
        await connection.run(`
      CREATE TEMP VIEW "${normalizeFilename(sessionFile.name)}" AS
      SELECT * FROM read_csv_auto('${sessionFile.url}', header=true)
    `);
      } catch {}
    }

    const start = new Date().getTime();
    const readerResult = await connection.runAndReadAll(query);
    const end = new Date().getTime();
    const elapsed = end - start;

    const columns = readerResult.columnNames();

    const rows = readerResult.getRowsJson();

    return {
      columns,
      elapsed,
      rows,
    };
  } finally {
    connection.closeSync();
  }
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

    const sessionFiles = await container.db
      .collection<SessionFile>('session-files')
      .find(
        {
          'session.id': request.params.id,
        },
        {
          projection: {
            _id: -1,
          },
        },
      )
      .toArray();

    const { columns, elapsed, rows } = await executeQuery(
      sessionFiles,
      request.body.query,
    );

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
