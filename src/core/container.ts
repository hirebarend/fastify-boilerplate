import duckdb, { DuckDBConnection } from '@duckdb/node-api';
import { Db, MongoClient } from 'mongodb';

export type Container = {
  db: Db;
  mongoClient: MongoClient;
};

let container: Container | null = null;

let initialized: boolean = false;

async function initialize(): Promise<void> {
  if (initialized) {
    return;
  }

  const connection = await DuckDBConnection.create();

  await connection.run(`INSTALL httpfs;`);
  await connection.run(`INSTALL cache_httpfs FROM community;`);
  await connection.run(`LOAD httpfs;`);
  await connection.run(`LOAD cache_httpfs;`);

  await connection.run(`PRAGMA cache_httpfs_type='on_disk';`);
  await connection.run(`PRAGMA cache_httpfs_cache_directory='./tmp';`);
  await connection.run(`PRAGMA cache_httpfs_cache_block_size=1048576;`);

  connection.closeSync();
}

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

  await initialize();

  return container;
}

export async function disposeContainer() {
  if (!container) {
    return;
  }

  await container.mongoClient.close();

  container = null;
}
