import { NextRequest, NextResponse } from "next/server";
import {
  markExpiredOrders,
  getExpirationStats,
} from "@/lib/utils/order-expiration";
import {
  AuthenticationError,
  successResponse,
  withErrorHandler,
} from "@/lib/utils/api-errors";

/**
 * POST /api/orders/expire
 * Mark expired orders as expired (for cron job or manual trigger)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Optional: Add API key authentication for cron jobs
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    throw new AuthenticationError("Invalid cron token");
  }

  // Mark expired orders
  const result = await markExpiredOrders();

  return successResponse(
    result,
    `Marked ${result.expiredCount} orders as expired`
  );
});

/**
 * GET /api/orders/expire
 * Get expiration statistics
 */
export const GET = withErrorHandler(async () => {
  const stats = await getExpirationStats();

  return successResponse(stats);
});
