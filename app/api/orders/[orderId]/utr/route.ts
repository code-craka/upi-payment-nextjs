import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Order, { SubmitUTRSchema } from "@/lib/db/models/order";
import {
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  successResponse,
  validateRequestBody,
} from "@/lib/utils/api-errors";
import {
  withStandardMiddleware,
  withAdminMiddleware,
  getUserFromRequest,
} from "@/lib/middleware/auth-middleware";
import {
  logUTRSubmission,
  logOrderStatusUpdate,
} from "@/lib/db/queries/audit-logs";
import { withRateLimit, rateLimiters } from "@/lib/utils/rate-limiter";
import { withCSRFProtection } from "@/lib/utils/csrf-protection";
import { SecureValidator, InputSanitizer } from "@/lib/utils/sanitization";
import { SensitiveDataHandler } from "@/lib/utils/encryption";
import { withSessionManagement } from "@/lib/utils/session-manager";
import { ensureNextResponse } from "@/lib/utils/response-converter";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

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
  async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
    const response = await withRateLimit(request, rateLimiters.utrSubmission, async () => {
      return withCSRFProtection(request, async () => {
        return withSessionManagement(request, async () => {
          const user = getUserFromRequest(request);
          if (!user) {
            throw new Error("Authentication required");
          }

          const { orderId } = await params;
          const sanitizedOrderId = InputSanitizer.sanitizeOrderId(orderId);

          // Connect to database
          await connectDB();

          // Parse and validate request body with sanitization
          const body = await request.json();
          const sanitizedBody = InputSanitizer.sanitizeObject(body);

          // Validate UTR with enhanced security
          const utrValidation = SecureValidator.validateUTR(sanitizedBody.utr);
          if (!utrValidation.isValid) {
            throw new BusinessLogicError(
              utrValidation.error || "Invalid UTR format"
            );
          }

          const { utr } = validateRequestBody(
            { utr: utrValidation.sanitized },
            SubmitUTRSchema
          );

          // Find order by orderId
          const order = await Order.findByOrderId(sanitizedOrderId);
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
              existingUTR: SensitiveDataHandler.maskUTR(order.utr),
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

          // Encrypt UTR before storing
          const encryptedUTR = await SensitiveDataHandler.encryptUTR(utr);

          // Update order with encrypted UTR and change status to pending-verification
          order.utr = encryptedUTR;
          order.status = "pending-verification";
          order.metadata = {
            ...order.metadata,
            utrSubmittedAt: new Date(),
            utrSubmissionIP: clientIP,
            utrSubmissionUserAgent: userAgent,
          };

          await order.save();

          // Log UTR submission for audit trail (with masked UTR)
          await logUTRSubmission(
            sanitizedOrderId,
            user.id,
            SensitiveDataHandler.maskUTR(utr),
            {
              ipAddress: clientIP,
              userAgent,
            }
          );

          // Log order status update
          await logOrderStatusUpdate(
            sanitizedOrderId,
            user.id,
            oldStatus,
            "pending-verification",
            "UTR submitted by customer",
            {
              ipAddress: clientIP,
              userAgent,
            }
          );

          // Return success response with masked UTR
          return NextResponse.json(
            {
              success: true,
              message: "UTR submitted successfully. Your payment is now under verification.",
              data: {
                orderId: order.orderId,
                utr: SensitiveDataHandler.maskUTR(utr),
                status: order.status,
                submittedAt: new Date(),
              },
            }
          );
        });
      });
    });
    return ensureNextResponse(response);
  },
  { requireAuth: false } // UTR submission doesn't require authentication
);

/**
 * GET /api/orders/[orderId]/utr
 * Get UTR submission status for an order
 */
export const GET = withStandardMiddleware(
  async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
    const response = await withRateLimit(request, rateLimiters.general, async () => {
      return withSessionManagement(request, async () => {
        const { orderId } = await params;
        const sanitizedOrderId = InputSanitizer.sanitizeOrderId(orderId);

        // Connect to database
        await connectDB();

        // Find order by orderId
        const order = await Order.findByOrderId(sanitizedOrderId);
        if (!order) {
          throw new NotFoundError("Order not found");
        }

        // Decrypt UTR if it exists for display
        let displayUTR = null;
        if (order.utr) {
          try {
            const decryptedUTR = await SensitiveDataHandler.decryptUTR(
              order.utr
            );
            displayUTR = SensitiveDataHandler.maskUTR(decryptedUTR);
          } catch (error) {
            console.error("Error decrypting UTR for display:", error);
            displayUTR = "****";
          }
        }

        // Return UTR status
        return NextResponse.json({
          success: true,
          data: {
            orderId: order.orderId,
            hasUTR: !!order.utr,
            utr: displayUTR,
            status: order.status,
            canSubmitUTR: order.canSubmitUTR(),
            submittedAt: order.metadata?.utrSubmittedAt,
          },
        });
      });
    });
    return ensureNextResponse(response);
  },
  { requireAuth: false } // UTR status check doesn't require authentication
);

/**
 * DELETE /api/orders/[orderId]/utr
 * Remove UTR from order (admin only, for corrections)
 */
export const DELETE = withAdminMiddleware(
  async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
    const response = await withRateLimit(request, rateLimiters.admin, async () => {
      return withCSRFProtection(request, async () => {
        return withSessionManagement(request, async () => {
          const user = getUserFromRequest(request);
          if (!user) {
            throw new Error("Authentication required");
          }

          const { orderId } = await params;
          const sanitizedOrderId = InputSanitizer.sanitizeOrderId(orderId);

          // Connect to database
          await connectDB();

          // Find order by orderId
          const order = await Order.findByOrderId(sanitizedOrderId);
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

          return NextResponse.json(
            {
              success: true,
              message: "UTR removed successfully",
              data: {
                orderId: order.orderId,
                status: order.status,
              },
            }
          );
        });
      });
    });
    return ensureNextResponse(response);
  }
);
