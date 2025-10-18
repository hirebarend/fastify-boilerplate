import duckdb, { DuckDBConnection } from '@duckdb/node-api';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

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

    reply.status(200).send({
      columns,
      elapsed,
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
