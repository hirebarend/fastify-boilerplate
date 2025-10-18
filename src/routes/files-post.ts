import * as crypto from 'crypto';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer } from '../core';

export const FILES_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Buffer;
      Querystring: { name: string; sessionId: string };
    }>,
    reply: FastifyReply,
  ) => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const container = await getContainer();

    const s3Client = new S3Client({ region: process.env.AWS_REGION });

    const hash: string = crypto
      .createHash('md5')
      .update(request.body)
      .digest('hex');

    await s3Client.send(
      new PutObjectCommand({
        ACL: 'public-read',
        Body: request.body,
        Bucket: process.env.AWS_S3_BUCKET,
        ContentType:
          request.headers['content-type'] || 'application/octet-stream',
        Key: hash,
      }),
    );

    await container.db.collection('files').insertOne({
      name: request.query.name,
      session: {
        id: request.query.sessionId,
      },
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`,
    });

    reply.status(200).send({
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${hash}`,
    });
  },
  method: 'POST',
  url: '/api/v1/files',
  schema: {
    tags: ['X-HIDDEN'],
    querystring: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
        },
      },
    },
  },
};
