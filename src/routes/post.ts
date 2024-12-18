import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import {
  createCertificateSigningRequest,
  saveCertificateSigningRequest,
} from '../core';

export const POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: { fqdn: string } }>,
    reply: FastifyReply,
  ) => {
    const certificateSigningRequest = await saveCertificateSigningRequest(
      await createCertificateSigningRequest(request.body.fqdn),
    );

    reply.status(200).send(certificateSigningRequest);
  },
  method: 'POST',
  url: '/api/v1',
  schema: {
    body: {
      type: 'object',
      properties: {
        fqdn: {
          type: 'string',
        },
      },
    },
  },
};
