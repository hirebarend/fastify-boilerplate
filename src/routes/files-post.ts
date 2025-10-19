import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export const FILES_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Buffer;
    }>,
    reply: FastifyReply,
  ) => {
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
