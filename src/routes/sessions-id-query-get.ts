import { executeQuery, getContainer, Query, SessionFile } from '../core';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const SESSIONS_ID_QUERY_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const sessionFiles = await container.db
      .collection<SessionFile>('session-files')
      .find(
        {
          deleted: false,
          'session.id': request.params.id,
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

    const query = await container.db.collection<Query>('queries').findOne(
      {
        'session.id': request.params.id,
      },
      {
        projection: {
          _id: 0,
        },
        sort: {
          created: -1,
        },
      },
    );

    if (!query) {
      return;
    }

    const result = await executeQuery(query.query, sessionFiles);

    reply.status(200).send({
      ...query,
      rows: result.rows,
    });
  },
  method: 'GET',
  url: '/api/v1/sessions/:id/query',
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
