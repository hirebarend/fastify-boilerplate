import { FastifyReply, RouteOptions } from 'fastify';
import { getContainer } from '../../container';
import { Consumer } from '../models';

async function handle(request: any, reply: FastifyReply): Promise<void> {
  const container = await getContainer();

  const consumer: Consumer | null =
    await container.consumerRepository.fromHeader(
      request.headers['authorization'],
    );

  if (!consumer) {
    reply.status(401).send();

    return;
  }

  reply.status(200).send(consumer);
}

export const BEETLE_CONSUMERS_GET: RouteOptions = {
  handler: handle,
  method: 'GET',
  url: '/api/v1/beetle/consumers',
  schema: {
    tags: ['X-HIDDEN'],
    security: [
      {
        apiKey: [],
      },
    ],
  },
};
