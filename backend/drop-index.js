const mongoose = require('mongoose');
// Mocking env since we cannot easily import the ESM one here
const MONGODB_URI = 'mongodb://localhost:27017/aropos';

async function dropIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        if (mongoose.connection.db) {
            console.log('Checking indexes on categories collection...');
            const collections = await mongoose.connection.db.listCollections({ name: 'categories' }).toArray();
            if (collections.length > 0) {
                const indexes = await mongoose.connection.db.collection('categories').indexes();
                console.log('Current indexes:', JSON.stringify(indexes, null, 2));

                if (indexes.some(idx => idx.name === 'aroniumId_1')) {
                    console.log('Dropping aroniumId_1...');
                    await mongoose.connection.db.collection('categories').dropIndex('aroniumId_1');
                    console.log('✅ Successfully dropped categories.aroniumId_1');
                } else {
                    console.log('Index aroniumId_1 not found.');
                }
            } else {
                console.log('Categories collection not found.');
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
