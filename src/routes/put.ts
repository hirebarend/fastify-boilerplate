import * as acme from 'acme-client';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import {
  ACME_CLIENT,
  findCertificateSigninRequest,
  persistCertificateAndKey,
} from '../core';

export const PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: { fqdn: string } }>,
    reply: FastifyReply,
  ) => {
    let certificateSigningRequest = await findCertificateSigninRequest(
      request.body.fqdn,
    );

    if (!certificateSigningRequest) {
      reply.status(404).send({
        message: 'unable to find certificate signing request',
      });

      return;
    }

    await ACME_CLIENT.completeChallenge(certificateSigningRequest.challenge);

    await new Promise((resolve) => setTimeout(resolve, 750));

    certificateSigningRequest = await findCertificateSigninRequest(
      request.body.fqdn,
    );

    if (!certificateSigningRequest) {
      reply.status(404).send({
        message: 'unable to find certificate signing request',
      });

      return;
    }

    if (certificateSigningRequest.order.status !== 'ready') {
      reply.status(400).send({
        message: `order status: ${certificateSigningRequest.order.status}`,
      });

      return;
    }

    const [key, csr] = await acme.crypto.createCsr({
      altNames: [request.body.fqdn],
    });

    certificateSigningRequest.order = await ACME_CLIENT.finalizeOrder(
      certificateSigningRequest.order,
      csr,
    );

    const certificate: string = await ACME_CLIENT.getCertificate(
      certificateSigningRequest.order,
    );

    await persistCertificateAndKey(request.body.fqdn, certificate, key);

    reply.status(200).send();
  },
  method: 'PUT',
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
