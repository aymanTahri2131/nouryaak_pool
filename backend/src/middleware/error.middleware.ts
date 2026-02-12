// ============================================
// Error Handling Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Custom API Error class
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error responses
export const errors = {
  badRequest: (message = 'Bad request') => new ApiError(400, message),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message = 'Forbidden') => new ApiError(403, message),
  notFound: (message = 'Resource not found') => new ApiError(404, message),
  conflict: (message = 'Conflict') => new ApiError(409, message),
  validation: (message = 'Validation error') => new ApiError(422, message),
  internal: (message = 'Internal server error') => new ApiError(500, message, false),
};

// Not found handler (for undefined routes)
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

// Global error handler
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = 500;
  let message = 'Internal server error';
  let stack: string | undefined;

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } 
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 422;
    message = err.message;
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // Handle MongoDB duplicate key error
  else if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Generic error
  else if (err.message) {
    message = err.message;
  }

  // Include stack trace in development
  if (env.isDevelopment) {
    stack = err.stack;
  }

  // Log error
  console.error(`❌ Error [${statusCode}]:`, message);
  if (env.isDevelopment && stack) {
    console.error(stack);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(stack && { stack }),
  });
}

// Async handler wrapper to catch errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default { ApiError, errors, notFoundHandler, errorHandler, asyncHandler };
