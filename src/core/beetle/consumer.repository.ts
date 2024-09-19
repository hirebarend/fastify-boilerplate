import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import * as mongoDb from 'mongodb';
import { Consumer } from './models';
import { TokenRepository } from './token.repository';

export class ConsumerRepository {
  protected cache: { [key: string]: string } = {};

  protected publicKeys: { [key: string]: string } | null = null;

  protected readonly collection: mongoDb.Collection<Consumer>;

  constructor(
    protected db: mongoDb.Db,
    protected tokenRepository: TokenRepository,
  ) {
    this.collection = this.db.collection<Consumer>('consumers');
  }

  public async create(consumer: Consumer): Promise<Consumer> {
    await this.collection.insertOne({
      emailAddress: consumer.emailAddress,
      id: consumer.id,
      metadata: consumer.metadata,
    });

    return consumer;
  }

  public async find(id: string): Promise<Consumer | null> {
    const x = await this.collection.findOne(
      { id },
      {
        projection: {
          _id: 0,
        },
      },
    );

    if (!x) {
      return null;
    }

    return x;
  }

  public async fromHeader(
    header: string | Array<string> | undefined,
  ): Promise<Consumer | null> {
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
      const consumerId: string | null = await this.tokenRepository.find(token);

      return consumerId ? await this.find(consumerId) : null;
    }

    const tokenDecoded: jsonwebtoken.Jwt | null = jsonwebtoken.decode(token, {
      complete: true,
    });

    if (!tokenDecoded) {
      return null;
    }

    if (!this.publicKeys || !this.publicKeys[tokenDecoded.header.kid || '']) {
      const response = await axios.get<{ [key: string]: string }>(
        'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', // TODO
      );

      this.publicKeys = response.data;
    }

    try {
      const result: jsonwebtoken.JwtPayload = jsonwebtoken.verify(
        token,
        this.publicKeys[tokenDecoded.header.kid || ''],
        {
          audience: process.env.JWT_AUDIENCE,
          issuer: process.env.JWT_ISSUER,
        },
      ) as jsonwebtoken.JwtPayload;

      if (!result.sub) {
        return null;
      }

      let consumer: Consumer | null = await this.find(result.sub);

      if (!consumer) {
        consumer = await this.create({
          emailAddress: result.email,
          id: result.sub,
          metadata: {},
        });
      }

      return consumer;
    } catch {
      return null;
    }
  }

  public async update(consumer: Consumer): Promise<Consumer> {
    await this.collection.updateOne(
      {
        id: consumer.id,
      },
      {
        $set: {
          metadata: consumer.metadata,
        },
      },
    );

    return consumer;
  }
}
