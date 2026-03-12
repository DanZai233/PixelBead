import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI 环境变量未设置'));
  }

  client = new MongoClient(uri, {
    appName: 'pixelbead',
    maxIdleTimeMS: 10000,
  });

  clientPromise = client.connect();
  return clientPromise;
}

export async function getDb(dbName = 'pixelbead') {
  const c = await getMongoClient();
  return c.db(dbName);
}
