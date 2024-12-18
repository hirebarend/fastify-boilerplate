import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { ACME_CLIENT, findCertificateSigninRequest } from '../core';

export const WELL_KNOWN_ACME_CHALLENGE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply,
  ) => {
    let certificateSigningRequest = await findCertificateSigninRequest(
      request.headers.host || '',
    );

    if (!certificateSigningRequest) {
      reply.status(404).send({
        message: 'unable to find certificate signing request',
      });

      return;
    }

    const challengeKeyAuthorization: string =
      await ACME_CLIENT.getChallengeKeyAuthorization(
        certificateSigningRequest.challenge,
      );

    reply.status(200).send(challengeKeyAuthorization);
  },
  method: 'GET',
  url: '/.well-known/acme-challenge/:token',
  schema: {
    params: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
        },
      },
    },
  },
};
