import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import qs from 'qs';
import {
  BEETLE_CONSUMERS_GET,
  BEETLE_TOKENS_GET,
  BEETLE_TOKENS_POST,
} from './core';
import { PEOPLE_POST } from './routes';
import { Logger } from './hooks';

export async function startServer() {
  const server = fastify({
    bodyLimit: 10 * 1048576, // 10MB
    caseSensitive: false,
    ignoreDuplicateSlashes: true,
    ignoreTrailingSlash: true,
    logger: true,
    querystringParser: (str) => qs.parse(str),
  });

  await server.register(fastifyCors, {
    allowedHeaders: '*',
    origin: '*',
  });

  await server.addContentTypeParser(
    [
      // TODO:
      'application/octet-stream',
      'application/pdf',
      'image/jpg',
      'image/jpeg',
      'image/png',
    ],
    { parseAs: 'buffer' },
    (
      request: any,
      payload: any,
      done: (error: Error | null, body: Buffer) => void,
    ) => {
      done(null, payload);
    },
  );

  if (process.env.MONGODB_CONNECTION_STRING) {
    server.addHook(
      'onResponse',
      await Logger(
        process.env.MONGODB_CONNECTION_STRING as string,
        'get-verified', // TODO
        'logs',
      ),
    );
  }

  await server.register(fastifySwagger, {
    swagger: {
      consumes: ['application/json'],
      host: process.env.HOST || 'localhost:8080',
      info: {
        description: '',
        title: 'API Specification',
        version: '0.1.0',
      },
      produces: ['application/json'],
      schemes: process.env.HOST ? ['https', 'http'] : ['http'],
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      externalDocs: {
        url: 'https://github.com/hirebarend/fastify-boilerplate',
        description: 'View Offical Documentation',
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  server.route(BEETLE_CONSUMERS_GET);

  server.route(BEETLE_TOKENS_GET);

  server.route(BEETLE_TOKENS_POST);

  server.route(PEOPLE_POST);

  server.route({
    handler: async (request, reply) => {
      reply.redirect('/docs', 302);
    },
    method: 'GET',
    url: '/',
    schema: {
      tags: ['X-HIDDEN'],
    },
  });

  server.route({
    handler: async (request, reply) => {
      try {
        reply.status(200).send();
      } catch {
        reply.status(503).send();
      }
    },
    method: 'GET',
    url: '/api/v1/health',
  });

  server.route({
    handler: async (request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/api/v1/ping',
  });

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  });

  await server.ready();
}
