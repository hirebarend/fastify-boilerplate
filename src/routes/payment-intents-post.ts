import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { PaymentIntent, PaymentIntentService } from '../core';

export const PAYMENT_INTENTS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { address: string; amount: number; reference: string };
    }>,
    reply: FastifyReply,
  ) => {
    const paymentIntent: PaymentIntent = await PaymentIntentService.create(
      request.body.address,
      request.body.amount,
      request.body.reference,
    );

    reply.status(200).send(paymentIntent);
  },
  method: 'POST',
  url: '/api/v1/payment-intents',
  schema: {
    tags: ['payment-intents'],
    body: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
        },
        amount: {
          type: 'number',
        },
        reference: {
          type: 'string',
        },
      },
    },
  },
};
