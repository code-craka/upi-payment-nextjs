import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf-token";

export { CSRF_TOKEN_HEADER, CSRF_COOKIE_NAME };

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER);
  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  return tokenFromHeader === tokenFromCookie;
}

/**
 * CSRF protection middleware wrapper
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  // Skip CSRF protection for GET requests
  if (request.method === "GET") {
    return handler();
  }

  // Validate CSRF token for state-changing requests
  if (!validateCSRFToken(request)) {
    return NextResponse.json(
      {
        error: "CSRF token validation failed",
        code: "CSRF_TOKEN_INVALID",
      },
      { status: 403 }
    );
  }

  return handler();
}

/**
 * Hook for using CSRF token in React components
 */
export function useCSRFToken() {
  return {
    token: generateCSRFToken(),
    getToken: generateCSRFToken,
  };
}
