import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { ClerkUserMetadata } from "@/lib/types/global";
import { getOrderStats } from "@/lib/db/queries/orders";
import {
  handleAPIError,
  AuthenticationError,
  successResponse,
  withErrorHandler,
} from "@/lib/utils/api-errors";

/**
 * GET /api/orders/stats
 * Get order statistics for the authenticated user
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Authenticate user
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new AuthenticationError();
  }

  // Check user role
  const userRole = (sessionClaims?.metadata as ClerkUserMetadata)?.role;
  const isAdmin = userRole === "admin";

  // Get statistics - admins see all, others see only their own
  const stats = await getOrderStats(isAdmin ? undefined : userId);

  return successResponse(stats);
});
