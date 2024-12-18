import axios from 'axios';
import * as acme from 'acme-client';
import { HttpChallenge } from 'acme-client/types/rfc8555';
import { ACME_CLIENT, getContainer } from '../core';

export async function createCertificateSigningRequest(fqdn: string): Promise<{
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
}> {
  const order: acme.Order = await ACME_CLIENT.createOrder({
    identifiers: [
      {
        type: 'dns',
        value: fqdn,
      },
    ],
  });

  const authorizations: Array<acme.Authorization> =
    await ACME_CLIENT.getAuthorizations(order);

  const authorization: acme.Authorization | null =
    authorizations.find((x) => x.identifier.type === 'dns') || null;

  if (!authorization) {
    throw new Error('unable to find authorization');
  }

  const challenge: HttpChallenge | undefined = authorization.challenges.find(
    (x) => x.type === 'http-01',
  );

  if (!challenge) {
    throw new Error('unable to find challenge');
  }

  const token: string =
    await ACME_CLIENT.getChallengeKeyAuthorization(challenge);

  return {
    order,
    authorization,
    challenge,
    token,
  };
}

export async function findCertificateSigninRequest(fqdn: string): Promise<{
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
} | null> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('certificate-signing-requests');

  const document = await collection.findOne({
    fqdn,
  });

  if (!document) {
    return null;
  }

  return {
    order: (await axios.get<acme.Order>(document.order)).data,
    authorization: (await axios.get<acme.Authorization>(document.authorization))
      .data,
    challenge: (await axios.get<HttpChallenge>(document.challenge)).data,
    token: document.token,
  };
}

export async function saveCertificateSigningRequest(certificateSigningRequest: {
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
}): Promise<{
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
}> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('certificate-signing-requests');

  await collection.insertOne({
    authorization: certificateSigningRequest.authorization.url,
    challenge: certificateSigningRequest.challenge.url,
    fqdn:
      certificateSigningRequest.order.identifiers.find((x) => x.type === 'dns')
        ?.value || '',
    order: certificateSigningRequest.order.url,
    token: certificateSigningRequest.token,
  });

  return certificateSigningRequest;
}
