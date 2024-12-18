import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { faker } from '@faker-js/faker';
import { Collection } from 'mongodb';
import { getContainer, Person } from '../core';

export const PEOPLE_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: { firstName: string; lastName: string } }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Person> =
      container.db.collection<Person>('people');

    const person: Person = {
      firstName: request.body.firstName,
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      lastName: request.body.lastName,
    };

    await collection.insertOne({
      ...person,
    });

    reply.status(200).send(person);
  },
  method: 'POST',
  url: '/api/v1/people',
  schema: {
    tags: ['people'],
    // Uncomment the following lines to enforce authentication
    // security: [
    //   {
    //     apiKey: [],
    //   },
    // ],
    body: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
    },
  },
};
