import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../.mongo-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

async function start() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'sekarpura_election',
      dbPath,
    },
  });

  console.log(`[MongoDB] Local persistent database active on port 27017 (${mongod.getUri()})`);

  const cleanup = async () => {
    console.log('[MongoDB] Stopping database...');
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

start().catch((err) => {
  console.error('[MongoDB] Failed to start:', err);
  process.exit(1);
});
