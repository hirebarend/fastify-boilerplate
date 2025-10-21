import {
  executeQuery,
  getContainer,
  parsePromptToSqlQuery,
  Query,
  SessionFile,
  toCsvBuffer,
  upload,
} from '../core';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const SESSIONS_ID_QUERY_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { prompt?: string; query?: string };
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { faker } = await import('@faker-js/faker');

      const container = await getContainer();

      const sessionFiles = await container.db
        .collection<SessionFile>('session-files')
        .find(
          {
            'session.id': request.params.id,
            updated: { $gte: new Date().getTime() - 86400000 },
          },
          {
            projection: {
              _id: 0,
            },
            sort: {
              created: 1,
            },
          },
        )
        .toArray();

      const q = request.body.prompt
        ? await parsePromptToSqlQuery(request.body.prompt, sessionFiles)
        : request.body.query || '';

      const result = await executeQuery(q, sessionFiles);

      const buffer: Buffer = toCsvBuffer(result.columns, result.rows);

      const file = await upload(buffer, 'text/csv');

      const query: Query = {
        contentType: 'text/csv',
        created: new Date().getTime(),
        hash: file.hash,
        id: faker.string.alphanumeric({
          casing: 'lower',
          length: 8,
        }),
        metadata: {
          prompt: undefined,
          columns: result.columns,
          count: result.rows.length,
          elapsed: result.elapsed,
        },
        name: '',
        query: q,
        session: {
          id: request.params.id,
        },
        size: buffer.length,
        updated: new Date().getTime(),
        url: file.url,
      };

      await container.db.collection<Query>('queries').insertOne(query);

      reply.status(200).send({
        ...query,
        rows: result.rows,
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      const message = error.message;

      if (!/^Parser Error:/i.test(message)) {
        throw error;
      }

      reply.status(400).send({
        message: message.replace(/^Parser Error:\s*/i, '').trim(),
      });
    }
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
