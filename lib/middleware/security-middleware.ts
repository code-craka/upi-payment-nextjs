import { NextRequest, NextResponse } from "next/server";
import {
  withRateLimit,
  rateLimiters,
  RateLimiter,
} from "@/lib/utils/rate-limiter";
import { withCSRFProtection } from "@/lib/utils/csrf-protection";
import { withSessionManagement } from "@/lib/utils/session-manager";
import { InputSanitizer } from "@/lib/utils/sanitization";

export interface SecurityOptions {
  rateLimiter?: RateLimiter;
  requireCSRF?: boolean;
  sanitizeInput?: boolean;
  sessionManagement?: boolean;
  skipPaths?: string[];
}

/**
 * Comprehensive security middleware that combines all security measures
 */
export async function withSecurity(
  req: NextRequest,
  handler: () => Promise<Response>,
  options: SecurityOptions = {}
): Promise<Response> {
  const {
    rateLimiter = rateLimiters.general,
    requireCSRF = true,
    sanitizeInput = true,
    sessionManagement = true,
    skipPaths = [],
  } = options;

  // Check if path should skip security
  const pathname = new URL(req.url).pathname;
  if (skipPaths.some((path) => pathname.startsWith(path))) {
    return handler();
  }

  // Apply rate limiting
  const rateLimitedHandler = () => withRateLimit(req, rateLimiter, handler);

  // Apply CSRF protection if required
  const csrfHandler = requireCSRF
    ? () => withCSRFProtection(req, rateLimitedHandler)
    : rateLimitedHandler;

  // Apply session management if required
  const sessionHandler = sessionManagement
    ? () => withSessionManagement(req, csrfHandler)
    : csrfHandler;

  return sessionHandler();
}

/**
 * Security middleware specifically for API routes
 */
export async function withAPISecurityMiddleware(
  req: NextRequest,
  handler: () => Promise<Response>,
  options: Partial<SecurityOptions> = {}
): Promise<Response> {
  const defaultOptions: SecurityOptions = {
    rateLimiter: rateLimiters.general,
    requireCSRF: true,
    sanitizeInput: true,
    sessionManagement: true,
    skipPaths: ["/api/auth/", "/api/webhooks/"],
  };

  return withSecurity(req, handler, { ...defaultOptions, ...options });
}

/**
 * Security middleware for admin routes
 */
export async function withAdminSecurityMiddleware(
  req: NextRequest,
  handler: () => Promise<Response>,
  options: Partial<SecurityOptions> = {}
): Promise<Response> {
  const defaultOptions: SecurityOptions = {
    rateLimiter: rateLimiters.admin,
    requireCSRF: true,
    sanitizeInput: true,
    sessionManagement: true,
    skipPaths: [],
  };

  return withSecurity(req, handler, { ...defaultOptions, ...options });
}

/**
 * Security middleware for order creation
 */
export async function withOrderSecurityMiddleware(
  req: NextRequest,
  handler: () => Promise<Response>,
  options: Partial<SecurityOptions> = {}
): Promise<Response> {
  const defaultOptions: SecurityOptions = {
    rateLimiter: rateLimiters.orderCreation,
    requireCSRF: true,
    sanitizeInput: true,
    sessionManagement: true,
    skipPaths: [],
  };

  return withSecurity(req, handler, { ...defaultOptions, ...options });
}

/**
 * Security middleware for UTR submission
 */
export async function withUTRSecurityMiddleware(
  req: NextRequest,
  handler: () => Promise<Response>,
  options: Partial<SecurityOptions> = {}
): Promise<Response> {
  const defaultOptions: SecurityOptions = {
    rateLimiter: rateLimiters.utrSubmission,
    requireCSRF: true,
    sanitizeInput: true,
    sessionManagement: true,
    skipPaths: [],
  };

  return withSecurity(req, handler, { ...defaultOptions, ...options });
}

/**
 * Sanitize request body recursively
 */
export function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  return InputSanitizer.sanitizeObject(body);
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: Response): Response {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev https://*.clerk.accounts.dev; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://clerk.dev https://*.clerk.accounts.dev https://api.clerk.dev; " +
      "frame-ancestors 'none';"
  );

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  return response;
}

/**
 * Complete security wrapper for API routes
 */
export function createSecureAPIRoute(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options: Partial<SecurityOptions> = {}
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const response = await withAPISecurityMiddleware(
        req,
        () => handler(req, context),
        options
      );

      return addSecurityHeaders(response);
    } catch (error) {
      console.error("Security middleware error:", error);

      const errorResponse = NextResponse.json(
        { error: "Security validation failed" },
        { status: 500 }
      );

      return addSecurityHeaders(errorResponse);
    }
  };
}
