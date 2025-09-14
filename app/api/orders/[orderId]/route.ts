import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { ClerkUserMetadata } from "@/lib/types/global";
import connectDB from "@/lib/db/connection";
import Order from "@/lib/db/models/order";
import SystemSettings from "@/lib/db/models/settings";
import { generateAllUpiLinks } from "@/lib/utils/upi-links";
import {
  handleAPIError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  successResponse,
  validateRequestBody,
  withErrorHandler,
} from "@/lib/utils/api-errors";

interface RouteParams {
  params: {
    orderId: string;
  };
}

/**
 * GET /api/orders/[orderId]
 * Get specific order details
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { orderId } = params;

    // Connect to database
    await connectDB();

    // Find order by orderId
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if order has expired and update status if needed
    if (order.isExpired() && order.status === "pending") {
      order.status = "expired";
      await order.save();
    }

    // Calculate time remaining (in seconds)
    const now = new Date();
    const timeRemaining = Math.max(
      0,
      Math.floor((order.expiresAt.getTime() - now.getTime()) / 1000)
    );

    // Get system settings for UPI app configuration
    const settings = await SystemSettings.getSettings();
    const enabledApps = settings.getEnabledApps();

    // Generate fresh UPI links (in case settings changed)
    const upiLinks = generateAllUpiLinks(
      {
        vpa: order.vpa,
        amount: order.amount,
        merchantName: order.merchantName,
        orderId: order.orderId,
        note: `Payment to ${order.merchantName}`,
      },
      enabledApps
    );

    // Return order details
    return successResponse({
      order: {
        orderId: order.orderId,
        amount: order.amount,
        merchantName: order.merchantName,
        vpa: order.vpa,
        status: order.status,
        utr: order.utr,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        paymentPageUrl: order.paymentPageUrl,
      },
      timeRemaining,
      upiLinks,
      enabledApps,
      canSubmitUTR: order.canSubmitUTR(),
    });
  }
);

/**
 * PATCH /api/orders/[orderId]
 * Update order status (admin only)
 */
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    // Authenticate user and check admin role
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const userRole = (sessionClaims?.metadata as ClerkUserMetadata)?.role;
    if (userRole !== "admin") {
      throw new AuthorizationError("Admin access required");
    }

    const { orderId } = params;

    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const updateSchema = z.object({
      status: z.enum([
        "pending",
        "pending-verification",
        "completed",
        "failed",
        "expired",
      ]),
      adminNotes: z.string().optional(),
    });

    const { status, adminNotes } = validateRequestBody(body, updateSchema);

    // Find and update order
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Update order status
    order.status = status;
    if (adminNotes) {
      order.metadata = {
        ...order.metadata,
        adminNotes,
        lastUpdatedBy: userId,
        lastUpdatedAt: new Date(),
      };
    }

    await order.save();

    return successResponse({
      orderId: order.orderId,
      status: order.status,
      updatedAt: new Date(),
    });
  }
);
