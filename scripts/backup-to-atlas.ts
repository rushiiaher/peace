import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getEnv } from '../lib/env';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SOURCE_URI = getEnv('MONGODB_URI');
const DEST_URI = process.env.ATLAS_URI; // User must provide this

if (!DEST_URI) {
    console.error('❌ Error: ATLAS_URI is not defined in .env');
    process.exit(1);
}

const BACKUP_BATCH_SIZE = 100;

// Collections to backup
// We fetch this dynamically, but good to know
// Specific fields to EXCLUDE from backup (to save space)
const EXCLUSIONS: Record<string, any> = {
    users: {
        'documents.photo': 0,
        'documents.idProof': 0,
        'documents.certificates': 0
    }
};

async function backup() {
    console.log('🚀 Starting Backup to Atlas...');

    // 1. Connect to Source (Local/VPS)
    const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log('✅ Connected to Source DB');

    // 2. Connect to Destination (Atlas)
    const destConn = await mongoose.createConnection(DEST_URI!).asPromise();
    console.log('✅ Connected to Destination DB (Atlas)');

    try {
        // Get all collection names from Source
        const collections = await sourceConn.db.listCollections().toArray();

        for (const col of collections) {
            const colName = col.name;
            if (colName === 'system.views') continue; // Skip views

            console.log(`\n📦 Backing up: ${colName}`);

            const SourceModel = sourceConn.collection(colName);
            const DestModel = destConn.collection(colName);

            // Determine filters/projection
            const projection = EXCLUSIONS[colName] || {};

            // Cursor for streaming data
            const cursor = SourceModel.find({}, { projection });

            let batch = [];
            let count = 0;
            let total = 0;

            // Iterate over cursor
            for await (const doc of cursor) {
                // Prepare bulk operation: Update if exists, Insert if not
                batch.push({
                    replaceOne: {
                        filter: { _id: doc._id },
                        replacement: doc,
                        upsert: true
                    }
                });

                count++;
                total++;

                if (count >= BACKUP_BATCH_SIZE) {
                    await DestModel.bulkWrite(batch);
                    process.stdout.write(`.`); // Progress indicator
                    batch = [];
                    count = 0;
                }
            }

            // Final batch
            if (batch.length > 0) {
                await DestModel.bulkWrite(batch);
            }

            console.log(` Done. (${total} docs)`);
        }

        console.log('\n✅ Backup Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Backup Failed:', error);
    } finally {
        await sourceConn.close();
        await destConn.close();
        process.exit(0);
    }
}

backup();
