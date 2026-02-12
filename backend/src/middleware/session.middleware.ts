// ============================================
// Session Middleware (for admin panel)
// ============================================

import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { getRedisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import type { RequestHandler } from 'express';

// Session configuration
export function createSessionMiddleware(): RequestHandler {
  const redisClient = getRedisClient();

  const sessionOptions: session.SessionOptions = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    },
  };

  // Use Redis store if available
  if (redisClient) {
    sessionOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'nouryaak-pool:session:',
    });
    console.log('✅ Session store: Redis');
  } else {
    console.warn('⚠️  Session store: Memory (not recommended for production)');
  }

  return session(sessionOptions);
}

// Extend session data
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

export default { createSessionMiddleware };
