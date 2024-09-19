import { RouteOptions } from 'fastify';
import { faker } from '@faker-js/faker';
import { Collection } from 'mongodb';
import { Consumer, getContainer, Person } from '../core';

export const PEOPLE_POST: RouteOptions = {
  handler: async (request, reply) => {
    const container = await getContainer();

    const consumer: Consumer | null =
      await container.consumerRepository.fromHeader(
        request.headers['authorization'],
      );

    if (!consumer) {
      reply.status(401).send();

      return;
    }

    const collection: Collection<Person> =
      container.db.collection<Person>('people');

    const body: {
      firstName: string;
      lastName: string;
    } = request.body as any;

    const person: Person = {
      firstName: body.firstName,
      id: faker.string.alphanumeric({
        casing: 'lower',
        length: 8,
      }),
      lastName: body.lastName,
    };

    await collection.insertOne({
      ...person,
    });

    reply.status(200).send(person);
  },
  method: 'POST',
  url: '/api/v1/people',
  schema: {
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
