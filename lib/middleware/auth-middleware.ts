import { NextRequest, NextResponse } from "next/server";
import {
  authenticateRequest,
  withAuth,
  withRole,
  withPermission,
  withAdmin,
} from "@/lib/auth/safe-auth";
import type { SafeUser, UserRole, Permission } from "@/lib/auth/types";
import { withRateLimit, rateLimiters } from "@/lib/utils/rate-limiter";
import { withSessionManagement } from "@/lib/utils/session-manager";
import { withCSRFProtection } from "@/lib/utils/csrf-protection";

export type APIHandler = (user: SafeUser) => Promise<NextResponse>;
export type PublicAPIHandler = () => Promise<NextResponse>;
export type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse | Response>;

/**
 * Standard middleware wrapper with authentication, rate limiting, and security
 */
export function withStandardMiddleware(
  handler: RouteHandler,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    csrf?: boolean;
    session?: boolean;
  } = {}
) {
  const {
    requireAuth = true,
    rateLimit = true,
    csrf = false,
    session = true,
  } = options;

  return async (request: NextRequest, context?: any) => {
    try {
      // Apply rate limiting if enabled
      if (rateLimit) {
        const rateLimitResult = await rateLimiters.general.isAllowed(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "Too many requests. Please try again later.",
              resetTime: rateLimitResult.resetTime,
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": "60",
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
              },
            }
          );
        }
      }

      // Apply CSRF protection if enabled
      if (csrf) {
        return withCSRFProtection(request, async () => {
          return executeHandler();
        });
      }

      return executeHandler();

      async function executeHandler(): Promise<NextResponse> {
        // Apply session management if enabled
        if (session) {
          const result = await withSessionManagement(request, async () => {
            return executeAuthHandler();
          });
          return result instanceof NextResponse ? result : NextResponse.json(result);
        }

        return executeAuthHandler();
      }

      async function executeAuthHandler(): Promise<NextResponse> {
        // Apply authentication if required
        if (requireAuth) {
          const result = await withAuth(request, async (user) => {
            // Add user to request context for the handler
            (request as any).user = user;
            const handlerResult = await handler(request, context);
            return handlerResult;
          });
          return result instanceof NextResponse ? result : NextResponse.json(result);
        }

        // For public endpoints, still try to get user context
        const authResult = await authenticateRequest(request);
        if (authResult.success && authResult.user) {
          (request as any).user = authResult.user;
        }

        const result = await handler(request, context);
        return result instanceof NextResponse ? result : NextResponse.json(result);
      }
    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only middleware wrapper
 */
export function withAdminMiddleware(
  handler: RouteHandler,
  options: {
    rateLimit?: boolean;
    csrf?: boolean;
    session?: boolean;
  } = {}
) {
  const { rateLimit = true, csrf = true, session = true } = options;

  return async (request: NextRequest, context?: any) => {
    try {
      // Apply rate limiting
      if (rateLimit) {
        const rateLimitResult = await rateLimiters.admin.isAllowed(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "Too many admin requests. Please try again later.",
              resetTime: rateLimitResult.resetTime,
            },
            { status: 429 }
          );
        }
      }

      // Apply CSRF protection
      if (csrf) {
        return withCSRFProtection(request, async () => {
          return executeHandler();
        });
      }

      return executeHandler();

      async function executeHandler(): Promise<NextResponse> {
        // Apply session management
        if (session) {
          const result = await withSessionManagement(request, async () => {
            return withAdmin(request, async (user) => {
              (request as any).user = user;
              const handlerResult = await handler(request, context);
              return handlerResult;
            });
          });
          return result instanceof NextResponse ? result : NextResponse.json(result);
        }

        const result = await withAdmin(request, async (user) => {
          (request as any).user = user;
          const handlerResult = await handler(request, context);
          return handlerResult;
        });
        return result instanceof NextResponse ? result : NextResponse.json(result);
      }
    } catch (error) {
      console.error("Admin middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based middleware wrapper
 */
export function withRoleMiddleware(
  role: UserRole,
  handler: RouteHandler,
  options: {
    rateLimit?: boolean;
    csrf?: boolean;
    session?: boolean;
  } = {}
) {
  const { rateLimit = true, csrf = false, session = true } = options;

  return async (request: NextRequest, context?: any) => {
    try {
      // Apply rate limiting
      if (rateLimit) {
        const rateLimitResult = await rateLimiters.general.isAllowed(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "Too many requests. Please try again later.",
              resetTime: rateLimitResult.resetTime,
            },
            { status: 429 }
          );
        }
      }

      // Apply CSRF protection
      if (csrf) {
        return withCSRFProtection(request, async () => {
          return executeHandler();
        });
      }

      return executeHandler();

      async function executeHandler(): Promise<NextResponse> {
        // Apply session management
        if (session) {
          const result = await withSessionManagement(request, async () => {
            return withRole(request, role, async (user) => {
              (request as any).user = user;
              const handlerResult = await handler(request, context);
              return handlerResult;
            });
          });
          return result instanceof NextResponse ? result : NextResponse.json(result);
        }

        const result = await withRole(request, role, async (user) => {
          (request as any).user = user;
          const handlerResult = await handler(request, context);
          return handlerResult;
        });
        return result instanceof NextResponse ? result : NextResponse.json(result);
      }
    } catch (error) {
      console.error("Role middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Permission-based middleware wrapper
 */
export function withPermissionMiddleware(
  permission: Permission,
  handler: RouteHandler,
  options: {
    rateLimit?: boolean;
    csrf?: boolean;
    session?: boolean;
  } = {}
) {
  const { rateLimit = true, csrf = false, session = true } = options;

  return async (request: NextRequest, context?: any) => {
    try {
      // Apply rate limiting
      if (rateLimit) {
        const rateLimitResult = await rateLimiters.general.isAllowed(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "Too many requests. Please try again later.",
              resetTime: rateLimitResult.resetTime,
            },
            { status: 429 }
          );
        }
      }

      // Apply CSRF protection
      if (csrf) {
        return withCSRFProtection(request, async () => {
          return executeHandler();
        });
      }

      return executeHandler();

      async function executeHandler(): Promise<NextResponse> {
        // Apply session management
        if (session) {
          const result = await withSessionManagement(request, async () => {
            return withPermission(request, permission, async (user) => {
              (request as any).user = user;
              const handlerResult = await handler(request, context);
              return handlerResult;
            });
          });
          return result instanceof NextResponse ? result : NextResponse.json(result);
        }

        const result = await withPermission(request, permission, async (user) => {
          (request as any).user = user;
          const handlerResult = await handler(request, context);
          return handlerResult;
        });
        return result instanceof NextResponse ? result : NextResponse.json(result);
      }
    } catch (error) {
      console.error("Permission middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Public endpoint middleware (no authentication required)
 */
export function withPublicMiddleware(
  handler: RouteHandler,
  options: {
    rateLimit?: boolean;
    csrf?: boolean;
  } = {}
) {
  const { rateLimit = true, csrf = false } = options;

  return async (request: NextRequest, context?: any) => {
    try {
      // Apply rate limiting
      if (rateLimit) {
        const rateLimitResult = await rateLimiters.general.isAllowed(request);
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "Too many requests. Please try again later.",
              resetTime: rateLimitResult.resetTime,
            },
            { status: 429 }
          );
        }
      }

      // Apply CSRF protection
      if (csrf) {
        return withCSRFProtection(request, async () => {
          const result = await handler(request, context);
          return result;
        });
      }

      const result = await handler(request, context);
      return result;
    } catch (error) {
      console.error("Public middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Error handling wrapper for API routes
 */
export function withErrorHandling<
  T extends (...args: any[]) => Promise<Response>,
>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof Error) {
        // Handle specific error types
        if (error.name === "AuthError") {
          return NextResponse.json(
            { error: error.message, code: "AUTH_ERROR" },
            { status: 401 }
          );
        }

        if (error.name === "PermissionError") {
          return NextResponse.json(
            { error: error.message, code: "PERMISSION_DENIED" },
            { status: 403 }
          );
        }

        if (error.name === "RoleError") {
          return NextResponse.json(
            { error: error.message, code: "ROLE_REQUIRED" },
            { status: 403 }
          );
        }

        // Handle validation errors
        if (error.name === "ZodError") {
          return NextResponse.json(
            { error: "Validation failed", details: error.message },
            { status: 400 }
          );
        }
      }

      // Generic error response
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }) as T;
}

/**
 * Helper to get user from request (after middleware processing)
 */
export function getUserFromRequest(request: NextRequest): SafeUser | null {
  return (request as any).user || null;
}
