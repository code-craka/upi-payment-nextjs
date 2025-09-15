import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db/connection";
import Order, { SubmitUTRSchema } from "@/lib/db/models/order";
import {
  handleAPIError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  successResponse,
  validateRequestBody,
  withErrorHandler,
} from "@/lib/utils/api-errors";
import {
  withStandardMiddleware,
  withAdminMiddleware,
} from "@/lib/middleware/error-handler";
import {
  logUTRSubmission,
  logOrderStatusUpdate,
} from "@/lib/db/queries/audit-logs";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

/**
 * POST /api/orders/[orderId]/utr
 * Submit UTR for order verification
 */
export const POST = withStandardMiddleware(
  async (request: NextRequest, { params }: RouteParams) => {
    const { orderId } = await params;

    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    const { utr } = validateRequestBody(body, SubmitUTRSchema);

    // Find order by orderId
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if order can accept UTR submission
    if (!order.canSubmitUTR()) {
      if (order.isExpired()) {
        throw new BusinessLogicError(
          "Order has expired. UTR submission not allowed."
        );
      }

      if (order.status !== "pending") {
        throw new BusinessLogicError(
          `Order status is ${order.status}. UTR can only be submitted for pending orders.`
        );
      }
    }

    // Check if UTR already exists for this order
    if (order.utr) {
      throw new ConflictError("UTR already submitted for this order", {
        existingUTR: order.utr,
      });
    }

    // Check if UTR is already used by another order
    const existingOrder = await Order.findOne({
      utr: utr,
      _id: { $ne: order._id },
    });

    if (existingOrder) {
      throw new ConflictError(
        "This UTR has already been used for another order"
      );
    }

    // Extract client metadata
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Store old status for audit logging
    const oldStatus = order.status;

    // Update order with UTR and change status to pending-verification
    order.utr = utr;
    order.status = "pending-verification";
    order.metadata = {
      ...order.metadata,
      utrSubmittedAt: new Date(),
      utrSubmissionIP: clientIP,
      utrSubmissionUserAgent: userAgent,
    };

    await order.save();

    // Log UTR submission for audit trail
    await logUTRSubmission(
      orderId,
      order.createdBy, // Use order creator as the user for UTR submission
      utr,
      {
        ipAddress: clientIP,
        userAgent,
      }
    );

    // Log order status update
    await logOrderStatusUpdate(
      orderId,
      order.createdBy,
      oldStatus,
      "pending-verification",
      "UTR submitted by customer",
      {
        ipAddress: clientIP,
        userAgent,
      }
    );

    // Return success response
    return successResponse(
      {
        orderId: order.orderId,
        utr: order.utr,
        status: order.status,
        submittedAt: new Date(),
      },
      "UTR submitted successfully. Your payment is now under verification."
    );
  }
);

/**
 * GET /api/orders/[orderId]/utr
 * Get UTR submission status for an order
 */
export const GET = withStandardMiddleware(
  async (request: NextRequest, { params }: RouteParams) => {
    const { orderId } = await params;

    // Connect to database
    await connectDB();

    // Find order by orderId
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Return UTR status
    return successResponse({
      orderId: order.orderId,
      hasUTR: !!order.utr,
      utr: order.utr,
      status: order.status,
      canSubmitUTR: order.canSubmitUTR(),
      submittedAt: order.metadata?.utrSubmittedAt,
    });
  }
);

/**
 * DELETE /api/orders/[orderId]/utr
 * Remove UTR from order (admin only, for corrections)
 */
export const DELETE = withAdminMiddleware(
  async (request: NextRequest, { params }: RouteParams) => {
    const { orderId } = await params;

    // Connect to database
    await connectDB();

    // Find order by orderId
    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Check if order has UTR
    if (!order.utr) {
      throw new BusinessLogicError("No UTR found for this order");
    }

    // Remove UTR and reset status to pending (if not expired)
    order.utr = undefined;
    order.status = order.isExpired() ? "expired" : "pending";
    order.metadata = {
      ...order.metadata,
      utrRemovedAt: new Date(),
      utrRemovedReason: "Admin correction",
    };

    await order.save();

    return successResponse(
      {
        orderId: order.orderId,
        status: order.status,
      },
      "UTR removed successfully"
    );
  }
);
