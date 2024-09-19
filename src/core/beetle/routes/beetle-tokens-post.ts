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

  const token: string = await container.tokenRepository.create(consumer.id);

  reply.status(200).send({
    token,
  });
}

export const BEETLE_TOKENS_POST: RouteOptions = {
  handler: handle,
  method: 'POST',
  url: '/api/v1/beetle/tokens',
  schema: {
    tags: ['X-HIDDEN'],
    security: [
      {
        apiKey: [],
      },
    ],
  },
};
