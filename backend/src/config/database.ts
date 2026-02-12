// ============================================
// MongoDB Database Connection
// ============================================

import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return mongoose;
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, options);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

    // Handle index cleanup for the sparse switch (Temporary fix)
    try {
      if (mongoose.connection.db) {
        // Cleanup for products
        const productsCol = await mongoose.connection.db.listCollections({ name: 'products' }).toArray();
        if (productsCol.length > 0) {
          await mongoose.connection.db.collection('products').dropIndex('aroniumId_1');
          console.log('✅ Dropped obsolete products.aroniumId index');
        }

        // Cleanup for categories
        const categoriesCol = await mongoose.connection.db.listCollections({ name: 'categories' }).toArray();
        if (categoriesCol.length > 0) {
          await mongoose.connection.db.collection('categories').dropIndex('aroniumId_1');
          console.log('✅ Dropped obsolete categories.aroniumId index');
        }
      }
    } catch (e) {
      // Ignore if index doesn't exist
    }

    return mongoose;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('📦 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error);
    throw error;
  }
}

export function getDatabaseStatus(): { connected: boolean; readyState: number } {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
  };
}

export default { connectDatabase, disconnectDatabase, getDatabaseStatus };
