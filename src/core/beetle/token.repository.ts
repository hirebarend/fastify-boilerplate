import { faker } from '@faker-js/faker';
import jsonwebtoken from 'jsonwebtoken';
import * as mongoDb from 'mongodb';

export class TokenRepository {
  protected cache: { [key: string]: string } = {};

  protected readonly collection: mongoDb.Collection<{
    consumerId: string;
    token: string;
  }>;

  constructor(protected db: mongoDb.Db) {
    this.collection = this.db.collection<{ consumerId: string; token: string }>(
      'tokens',
    );
  }

  public async create(consumerId: string): Promise<string> {
    const token = {
      consumerId,
      token: `key_${faker.string.alphanumeric({
        casing: 'lower',
        length: 16,
      })}`,
    };

    await this.collection.insertOne({
      ...token,
    });

    return token.token;
  }

  public async find(token: string): Promise<string | null> {
    if (this.cache[token]) {
      return this.cache[token];
    }

    const x = await this.collection.findOne({ token });

    if (!x) {
      return null;
    }

    this.cache[token] = x.consumerId;

    return x.consumerId;
  }

  public async findAll(consumerId: string): Promise<Array<string>> {
    return (
      await this.collection
        .find({
          consumerId,
        })
        .toArray()
    ).map((x) => x.token);
  }

  public async fromHeader(
    header: string | Array<string> | undefined,
  ): Promise<string | null> {
    if (!header) {
      return null;
    }

    if (header instanceof Array) {
      return null;
    }

    const headerSplitted: Array<string> = header.split(' ');

    if (headerSplitted.length !== 2) {
      return null;
    }

    if (headerSplitted[0].toLowerCase() !== 'bearer') {
      return null;
    }

    const token: string = headerSplitted[1];

    if (token.startsWith('key_')) {
      return await this.find(token);
    }

    const result: any = jsonwebtoken.decode(token);

    return result.sub;
  }
}
