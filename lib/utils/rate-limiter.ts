import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000
);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async isAllowed(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(req)
      : this.getDefaultKey(req);

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const record = store[key];

    // Check if within rate limit
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    // Increment counter
    record.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  private getDefaultKey(req: NextRequest): string {
    // Use IP address and user agent for rate limiting key
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    return `${ip}:${userAgent}`;
  }
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // Strict rate limiting for order creation
  orderCreation: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 orders per 15 minutes per IP
  }),

  // Moderate rate limiting for UTR submission
  utrSubmission: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 UTR submissions per 5 minutes
  }),

  // General API rate limiting
  general: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),

  // Admin operations rate limiting
  admin: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // 30 admin operations per minute
  }),

  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 auth attempts per 15 minutes
  }),
};

export async function withRateLimit(
  req: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await rateLimiter.isAllowed(req);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimiter["config"].maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetTime.toString(),
          "Retry-After": Math.ceil(
            (result.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  const response = await handler();

  // Add rate limit headers to successful responses
  const maxRequests = (rateLimiter as any).config.maxRequests;
  response.headers.set("X-RateLimit-Limit", maxRequests.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

  return response;
}
