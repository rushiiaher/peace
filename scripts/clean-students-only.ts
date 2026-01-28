import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getEnv } from '../lib/env';

// Load env
dotenv.config();
dotenv.config({ path: '.env.local' });

const MONGODB_URI = getEnv('MONGODB_URI');

async function cleanStudentsOnly() {
    console.log('🧹 Starting "Students-Only" Deep Clean...');

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing');
        process.exit(1);
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to DB');

    try {
        // 1. Delete Student Users
        console.log('Deleting Student Users...');
        const userRes = await conn.connection.collection('users').deleteMany({ role: 'student' });
        console.log(`   - Removed ${userRes.deletedCount} students.`);

        // 2. Clear Student References in Batches
        console.log('Clearing Batches...');
        const batchRes = await conn.connection.collection('batches').updateMany({}, { $set: { students: [] } });
        console.log(`   - Updated ${batchRes.modifiedCount} batches.`);

        // 3. Reset Institute Pending Payments
        console.log('Resetting Institute Pending Payments...');
        const instRes = await conn.connection.collection('institutes').updateMany({}, { $set: { pendingPayment: 0 } });
        console.log(`   - Updated ${instRes.modifiedCount} institutes.`);

        // 4. Wipe Related Collections completely
        const collectionsToWipe = [
            'examresults',
            'finalresults',
            'admitcards',
            'feepayments',
            'payments',      // Platform fees
            'studentfees',   // Institute fees tracking
            'reschedulerequests',
            'feedbackresponses',
            'enquiries',
            'transactions'
        ];

        for (const colName of collectionsToWipe) {
            // Check if collection exists
            const list = await conn.connection.db.listCollections({ name: colName }).toArray();
            if (list.length > 0) {
                const res = await conn.connection.collection(colName).deleteMany({});
                console.log(`🗑️  Deleted all data from: ${colName} (${res.deletedCount} docs)`);
            } else {
                console.log(`   Skipping ${colName} (Does not exist)`);
            }
        }

        console.log('\n✨ Database Cleaned! (Institutes, Courses, and Admins are SAFE).');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanStudentsOnly();
