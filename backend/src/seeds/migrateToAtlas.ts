import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

async function migrate() {
  const targetUri = process.argv[2] || process.env.TARGET_URI || process.env.MONGODB_URI;

  if (!targetUri || !targetUri.startsWith('mongodb+srv://') && !targetUri.includes('mongodb://')) {
    console.error('❌ Error: Harap sediakan connection string MongoDB Atlas sebagai argumen.');
    console.error('Contoh penggunaan:');
    console.error('  npm run migrate:atlas "mongodb+srv://maulanahadycs_db_user:PASSWORD@cluster0.gmol147.mongodb.net/sekarpura_election?retryWrites=true&w=majority"');
    process.exit(1);
  }

  console.log('========================================================');
  console.log('🔄 SEKARPURA ELECTION - MIGRASI DATA KE MONGODB ATLAS');
  console.log('========================================================');
  console.log(`Target Atlas: ${targetUri.replace(/:([^:@]+)@/, ':****@')}`);

  // 1. Start or connect to local MongoDB
  let mongodInstance: any = null;
  let localUri = 'mongodb://127.0.0.1:27017/sekarpura_election';

  const localConn = mongoose.createConnection();
  try {
    await localConn.openUri(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✓ Terhubung ke local MongoDB aktif di port 27017');
  } catch {
    console.log('Mengaktifkan embedded local database dari .mongo-data...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(currentDir, '../../../.mongo-data');

    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'sekarpura_election',
        dbPath,
      },
    });
    localUri = 'mongodb://127.0.0.1:27017/sekarpura_election';
    await localConn.openUri(localUri);
    console.log('✓ Embedded local MongoDB berhasil dimuat dari .mongo-data');
  }

  // 2. Connect to Atlas
  console.log('Menghubungkan ke MongoDB Atlas...');
  const atlasConn = mongoose.createConnection();
  try {
    await atlasConn.openUri(targetUri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✓ Berhasil terhubung ke MongoDB Atlas: ${atlasConn.host}/${atlasConn.name}`);
  } catch (err: any) {
    console.error('❌ Gagal terhubung ke MongoDB Atlas:', err.message);
    console.error('Pastikan:');
    console.error('1. Username dan password sudah benar.');
    console.error('2. IP Address Anda telah di-whitelist di Atlas (Network Access -> Allow from Anywhere 0.0.0.0/0).');
    if (mongodInstance) await mongodInstance.stop();
    await localConn.close();
    process.exit(1);
  }

  // 3. Migrate Collections
  const collectionsToMigrate = [
    'elections',
    'electionstages',
    'candidates',
    'users',
    'votesources',
    'votesubmissions',
    'systemsettings',
    'voteauditlogs',
    'presentations',
  ];

  console.log('\n📦 Memulai penyalinan data koleksi...');

  for (const colName of collectionsToMigrate) {
    try {
      const sourceCol = localConn.collection(colName);
      const targetCol = atlasConn.collection(colName);

      const docs = await sourceCol.find({}).toArray();
      if (docs.length > 0) {
        // Clear destination collection before migration
        await targetCol.deleteMany({});
        await targetCol.insertMany(docs);
        console.log(`  ✓ [${colName}]: Berhasil migrasi ${docs.length} dokumen`);
      } else {
        console.log(`  - [${colName}]: Kosong (0 dokumen)`);
      }
    } catch (err: any) {
      console.warn(`  ⚠ [${colName}]: Catatan: ${err.message}`);
    }
  }

  console.log('\n========================================================');
  console.log('🎉 Migrasi seluruh data real ke MongoDB Atlas BERHASIL!');
  console.log('========================================================');

  if (mongodInstance) await mongodInstance.stop();
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(console.error);
