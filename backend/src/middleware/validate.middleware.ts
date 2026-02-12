// ============================================
// Validation Middleware (Zod)
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodType } from 'zod';
import { ApiError } from './error.middleware.js';

// Validate request body
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(422, `Validation error: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

// Validate request params
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(400, `Invalid parameters: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

// Validate request query
export function validateQuery<T>(schema: ZodType<T, any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(400, `Invalid query parameters: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

// Validate all (body, params, query)
export function validate<B, P, Q>(schemas: {
  body?: ZodSchema<B>;
  params?: ZodSchema<P>;
  query?: ZodSchema<Q>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(422, `Validation error: ${message}`));
      } else {
        next(error);
      }
    }
  };
}

export default { validateBody, validateParams, validateQuery, validate };
