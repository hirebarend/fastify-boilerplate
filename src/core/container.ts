import { Db, MongoClient } from 'mongodb';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
};

let container: Container | null = null;

export async function getContainer() {
  if (container) {
    return container;
  }

  const mongoClient = await MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
  );

  const db = mongoClient.db(process.env.MONGODB_DATABASE_NAME as string);

  container = {
    db,
    mongoClient,
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
