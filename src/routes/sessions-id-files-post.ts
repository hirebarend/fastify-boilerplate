import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
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

    const instance = await DuckDBInstance.create(':memory:');

    const connection = await DuckDBConnection.create(instance);

    const readerResultCount = await connection.runAndReadAll(
      `SELECT COUNT(*) FROM read_csv_auto('${request.body.url}', header=true)`,
    );

    const readerResultRows = await connection.runAndReadAll(
      `SELECT * FROM read_csv_auto('${request.body.url}', header=true)`,
    );

    connection.closeSync();
    instance.closeSync();

    await container.db.collection<SessionFile>('session-files').updateMany(
      {
        deleted: false,
        name: request.body.name,
        'session.id': request.params.id,
      },
      {
        $set: {
          deleted: true,
        },
      },
    );

    const sessionFile: SessionFile = {
      created: new Date().getTime(),
      deleted: false,
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      metadata: {
        columns: readerResultRows.columnNames(),
        count: readerResultCount.getRowsJson()[0][0] as number,
      },
      name: request.body.name,
      session: {
        id: request.params.id,
      },
      updated: new Date().getTime(),
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
    body: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        url: {
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
