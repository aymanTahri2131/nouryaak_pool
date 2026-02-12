import mongoose from 'mongoose';
import { env } from './src/config/env.js';

async function dropIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(env.MONGODB_URI);
        console.log('Connected.');

        if (mongoose.connection.db) {
            console.log('Dropping categories.aroniumId_1 index...');
            try {
                await mongoose.connection.db.collection('categories').dropIndex('aroniumId_1');
                console.log('✅ Successfully dropped categories.aroniumId_1');
            } catch (e) {
                console.log('❌ Failed/Already dropped categories.aroniumId_1:', (e as any).message);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

dropIndex();
