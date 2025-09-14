/**
 * API Error Handling Utilities
 * Centralized error handling for API routes
 */

import { NextResponse } from "next/server";
import { z } from "zod";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT_ERROR", details);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends APIError {
  constructor(message: string = "External service unavailable") {
    super(message, 503, "EXTERNAL_SERVICE_ERROR");
    this.name = "ExternalServiceError";
  }
}

/**
 * Format Zod validation errors
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join(", ");
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleAPIError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Handle custom API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: formatZodError(error),
      },
      { status: 400 }
    );
  }

  // Handle MongoDB duplicate key errors
  if (error instanceof Error && error.message.includes("duplicate key")) {
    const field = extractDuplicateKeyField(error.message);
    return NextResponse.json(
      {
        error: `Duplicate ${field || "value"} provided`,
        code: "DUPLICATE_ERROR",
      },
      { status: 409 }
    );
  }

  // Handle MongoDB connection errors
  if (error instanceof Error && error.message.includes("connection")) {
    return NextResponse.json(
      {
        error: "Database connection failed",
        code: "DATABASE_CONNECTION_ERROR",
      },
      { status: 503 }
    );
  }

  // Handle MongoDB validation errors
  if (error instanceof Error && error.name === "ValidationError") {
    return NextResponse.json(
      {
        error: "Database validation failed",
        code: "DATABASE_VALIDATION_ERROR",
        details: error.message,
      },
      { status: 400 }
    );
  }

  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  if (error instanceof Error && error.name === "CastError") {
    return NextResponse.json(
      {
        error: "Invalid data format",
        code: "CAST_ERROR",
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Extract field name from MongoDB duplicate key error message
 */
function extractDuplicateKeyField(errorMessage: string): string | null {
  const match = errorMessage.match(/index: (\w+)_/);
  return match ? match[1] : null;
}

/**
 * Validate request body with Zod schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Request validation failed",
        formatZodError(error)
      );
    }
    throw error;
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Query parameter validation failed",
        formatZodError(error)
      );
    }
    throw error;
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status: statusCode }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Rate limiting error
 */
export class RateLimitError extends APIError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

/**
 * Business logic error (for domain-specific errors)
 */
export class BusinessLogicError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 422, "BUSINESS_LOGIC_ERROR", details);
    this.name = "BusinessLogicError";
  }
}
