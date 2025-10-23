import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, SessionFile } from '../core';

export const SESSIONS_ID_FILES_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { id: string };
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

    reply.status(200).send(sessionFiles);
  },
  method: 'GET',
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
