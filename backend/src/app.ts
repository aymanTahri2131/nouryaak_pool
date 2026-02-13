// ============================================
// aroPos Backend - Main Application
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';

import { env, validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeSocket } from './config/socket.js';
import { setupSocketHandlers } from './socket/index.js';
import { getAroniumDatabase, closeAroniumDatabase } from './aronium/connection.js';
import { startScheduledJobs, stopScheduledJobs, runInitialSync } from './jobs/syncScheduler.js';

import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Validate environment
validateEnv();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow any origin (e.g. 192.168.x.x, 10.0.2.2)
    if (env.isDevelopment) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.isDevelopment) {
  app.use(morgan('dev'));

  // Detailed logging for debugging mobile app issues
  app.use((req, res, next) => {
    console.log(`📝 [${req.method}] ${req.url}`);
    if (Object.keys(req.body).length > 0) {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    if (req.headers.authorization) {
      console.log('🔑 Auth Token Present:', req.headers.authorization.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No Auth Token');
    }
    next();
  });
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'aroPos API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.io
const io = initializeSocket(httpServer);
setupSocketHandlers(io);

// Startup function
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting aroPos Backend...');
    console.log(`📍 Environment: ${env.NODE_ENV}`);

    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis (optional - will continue if fails)
    // try {
    //   await connectRedis();
    // } catch (error) {
    //   console.warn('⚠️  Redis connection failed, using memory store for sessions');
    // }

    // Connect to Aronium SQLite
    const aroniumDb = getAroniumDatabase();
    if (aroniumDb) {
      console.log('✅ Aronium database connected');

      // Run initial sync
      await runInitialSync();

      // Start scheduled jobs
      startScheduledJobs();
    } else {
      console.warn('⚠️  Aronium database not available');
    }

    // Start HTTP server
    httpServer.listen(env.PORT, '0.0.0.0', () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log(`  🎉 aroPos Backend is running!`);
      console.log(`  🌐 HTTP: http://0.0.0.0:${env.PORT}`);
      console.log(`  🔌 Socket.io: ws://0.0.0.0:${env.PORT}`);
      console.log(`  📦 API: http://0.0.0.0:${env.PORT}/api`);
      console.log('═══════════════════════════════════════════');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('');
  console.log('🛑 Shutting down gracefully...');

  // Stop scheduled jobs
  stopScheduledJobs();

  // Close Aronium connection
  closeAroniumDatabase();

  // Disconnect Redis
  await disconnectRedis();

  // Disconnect MongoDB
  await disconnectDatabase();

  // Close HTTP server
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
startServer();

export default app;
