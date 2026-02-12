// ============================================
// Environment Configuration
// ============================================

import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nouryaak-pool',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',

  // Aronium
  ARONIUM_DB_PATH: process.env.ARONIUM_DB_PATH || '',
  ARONIUM_EXPORT_ENABLED: process.env.ARONIUM_EXPORT_ENABLED === 'true',

  // Sync
  SYNC_INTERVAL_MINUTES: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
  AUTO_SYNC_ENABLED: process.env.AUTO_SYNC_ENABLED === 'true',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Validate required environment variables
export function validateEnv(): void {
  const required = ['JWT_SECRET', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key] || process.env[key] === 'default-secret-change-me');

  if (missing.length > 0 && env.isProduction) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (missing.length > 0 && env.isDevelopment) {
    console.warn(`⚠️  Warning: Using default values for: ${missing.join(', ')}`);
  }
}

export default env;
