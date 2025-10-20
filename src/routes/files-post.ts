import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { upload } from '../core';

export const FILES_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Buffer;
    }>,
    reply: FastifyReply,
  ) => {
    reply
      .status(200)
      .send(
        await upload(
          request.body,
          request.headers['content-type'] || 'application/octet-stream',
        ),
      );
  },
  method: 'POST',
  url: '/api/v1/files',
  schema: {
    tags: ['X-HIDDEN'],
  },
};
