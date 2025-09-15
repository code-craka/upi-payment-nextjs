/**
 * Legacy Error Handling Middleware - Use auth-middleware.ts for new implementations
 * Provides consistent error handling across all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { handleAPIError, APIError } from "@/lib/utils/api-errors";

// Re-export from new auth middleware system
export {
  withStandardMiddleware,
  withAdminMiddleware,
  withRoleMiddleware,
  withPermissionMiddleware,
  withPublicMiddleware,
  withErrorHandling as withAuthErrorHandling,
} from "./auth-middleware";

export type { APIHandler, PublicAPIHandler } from "./auth-middleware";

// Legacy type for backward compatibility
export type LegacyAPIHandler = (
  request: NextRequest,
  context?: { params?: any }
) => Promise<NextResponse>;

/**
 * Legacy error handling wrapper - use withAuthErrorHandling for new code
 */
export function withErrorHandling(handler: LegacyAPIHandler): LegacyAPIHandler {
  return async (request: NextRequest, context?: { params?: any }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Log error for monitoring
      console.error(`API Error in ${request.method} ${request.url}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
      });

      return handleAPIError(error);
    }
  };
}

/**
 * Legacy middleware for request validation - use auth-middleware.ts for new code
 */
export function withRequestValidation(
  handler: LegacyAPIHandler,
  options: {
    requireAuth?: boolean;
    requireRole?: string[];
    maxBodySize?: number;
    allowedMethods?: string[];
  } = {}
): LegacyAPIHandler {
  return withErrorHandling(async (request, context) => {
    // Check allowed methods
    if (
      options.allowedMethods &&
      !options.allowedMethods.includes(request.method)
    ) {
      throw new APIError(
        `Method ${request.method} not allowed`,
        405,
        "METHOD_NOT_ALLOWED"
      );
    }

    // Check content length for POST/PUT requests
    if (
      options.maxBodySize &&
      ["POST", "PUT", "PATCH"].includes(request.method)
    ) {
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > options.maxBodySize) {
        throw new APIError("Request body too large", 413, "PAYLOAD_TOO_LARGE");
      }
    }

    // Validate content type for requests with body
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new APIError(
          "Content-Type must be application/json",
          400,
          "INVALID_CONTENT_TYPE"
        );
      }
    }

    return handler(request, context);
  });
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: LegacyAPIHandler,
  options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (request: NextRequest) => string;
  }
): LegacyAPIHandler {
  return withErrorHandling(async (request, context) => {
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);

    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
    } else if (current.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
    } else if (current.count >= options.maxRequests) {
      throw new APIError("Too many requests", 429, "RATE_LIMIT_EXCEEDED");
    } else {
      current.count++;
    }

    return handler(request, context);
  });
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: LegacyAPIHandler,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}
): LegacyAPIHandler {
  return withErrorHandling(async (request, context) => {
    const response = await handler(request, context);

    // Set CORS headers
    const origin = request.headers.get("origin");
    const allowedOrigins = Array.isArray(options.origin)
      ? options.origin
      : [options.origin || "*"];

    if (
      origin &&
      (allowedOrigins.includes("*") || allowedOrigins.includes(origin))
    ) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    if (options.methods) {
      response.headers.set(
        "Access-Control-Allow-Methods",
        options.methods.join(", ")
      );
    }

    if (options.allowedHeaders) {
      response.headers.set(
        "Access-Control-Allow-Headers",
        options.allowedHeaders.join(", ")
      );
    }

    if (options.credentials) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return response;
  });
}

/**
 * Request logging middleware
 */
export function withLogging(handler: LegacyAPIHandler): LegacyAPIHandler {
  return withErrorHandling(async (request, context) => {
    const startTime = Date.now();

    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.url} - Started`
    );

    const response = await handler(request, context);

    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.url} - ${response.status} (${duration}ms)`
    );

    return response;
  });
}

/**
 * Compose multiple middleware functions
 */
export function compose(
  ...middlewares: ((handler: LegacyAPIHandler) => LegacyAPIHandler)[]
): (handler: LegacyAPIHandler) => LegacyAPIHandler {
  return (handler: LegacyAPIHandler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Legacy middleware combinations - use auth-middleware.ts for new implementations
 */
export const withLegacyStandardMiddleware = compose(
  withLogging,
  (handler) =>
    withRequestValidation(handler, {
      maxBodySize: 1024 * 1024, // 1MB
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    }),
  (handler) =>
    withRateLimit(handler, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    })
);

export const withLegacyAuthMiddleware = compose(
  withLegacyStandardMiddleware,
  (handler) => withRequestValidation(handler, { requireAuth: true })
);

export const withLegacyAdminMiddleware = compose(
  withLegacyAuthMiddleware,
  (handler) => withRequestValidation(handler, { requireRole: ["admin"] })
);
