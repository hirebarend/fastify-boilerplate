import { DuckDBConnection } from '@duckdb/node-api';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, SessionFile } from '../core';

export const SESSIONS_ID_FILES_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { name: string; url: string };
      Params: { id: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { faker } = await import('@faker-js/faker');

    const container = await getContainer();

    const connection = await DuckDBConnection.create();

    const readerResult = await connection.runAndReadAll(
      `SELECT COUNT(*) FROM read_csv_auto('${request.body.url}', header=true)`,
    );

    const rows = readerResult.getRowsJson();

    connection.closeSync();

    const sessionFile: SessionFile = {
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      metadata: {
        columns: [], // TODO
        count: rows[0][0] as number,
      },
      name: request.body.name,
      session: {
        id: request.params.id,
      },
      url: request.body.url,
    };

    await container.db
      .collection<SessionFile>('session-files')
      .insertOne(sessionFile);

    reply.status(200).send(sessionFile);
  },
  method: 'POST',
  url: '/api/v1/sessions/:id/files',
  schema: {
    tags: ['sessions'],
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
