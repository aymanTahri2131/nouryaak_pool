// ============================================
// Redis Connection (for sessions)
// ============================================

import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isConnected = false;

export async function connectRedis(): Promise<Redis> {
  if (redisClient && isConnected) {
    console.log('🔴 Using existing Redis connection');
    return redisClient;
  }

  try {
    console.log('🔴 Connecting to Redis...');

    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    } as any);

    // Event handlers
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // Redis is optional - continue without it
    console.warn('⚠️  Continuing without Redis (sessions will use memory store)');
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) return;

  try {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('🔴 Redis disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function getRedisStatus(): { connected: boolean } {
  return { connected: isConnected };
}

export default { connectRedis, disconnectRedis, getRedisClient, getRedisStatus };
