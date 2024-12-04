import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { PaymentIntent, PaymentIntentService } from '../core';

export const PAYMENT_INTENTS_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { address: string };
    }>,
    reply: FastifyReply,
  ) => {
    const paymentIntent: PaymentIntent | null =
      await PaymentIntentService.findByAddress(request.params.address);

    if (!paymentIntent) {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(paymentIntent);
  },
  method: 'GET',
  url: '/api/v1/payment-intents/:address',
  schema: {
    tags: ['payment-intents'],
    params: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
        },
      },
    },
  },
};
