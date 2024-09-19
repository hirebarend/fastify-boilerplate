import { Db, MongoClient } from 'mongodb';
import { ConsumerRepository, TokenRepository } from './beetle';

export type Container = {
  consumerRepository: ConsumerRepository;
  db: Db;
  mongoClient: MongoClient;
  tokenRepository: TokenRepository;
};

let container: Container | null = null;

export async function getContainer() {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );

  const db = mongoClient.db('get-verified');

  const tokenRepository: TokenRepository = new TokenRepository(db);

  container = {
    consumerRepository: new ConsumerRepository(db, tokenRepository),
    db,
    mongoClient,
    tokenRepository,
  };

  return container;
}

export async function disposeContainer() {
  if (!container) {
    return;
  }

  await container.mongoClient.close();

  container = null;
}
