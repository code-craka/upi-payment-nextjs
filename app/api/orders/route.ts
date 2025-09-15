import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { ClerkUserMetadata } from "@/lib/types/global";
import connectDB from "@/lib/db/connection";
import Order, { CreateOrderSchema } from "@/lib/db/models/order";
import SystemSettings from "@/lib/db/models/settings";
import { generateOrderId } from "@/lib/utils/validation";
import { generateAllUpiLinks } from "@/lib/utils/upi-links";
import {
  handleAPIError,
  AuthenticationError,
  AuthorizationError,
  successResponse,
  validateRequestBody,
  validateQueryParams,
  withErrorHandler,
} from "@/lib/utils/api-errors";
import {
  withStandardMiddleware,
  getUserFromRequest,
} from "@/lib/middleware/auth-middleware";
import { logOrderCreation } from "@/lib/db/queries/audit-logs";
import { withRateLimit, rateLimiters } from "@/lib/utils/rate-limiter";
import { withCSRFProtection } from "@/lib/utils/csrf-protection";
import { InputSanitizer, SecureValidator } from "@/lib/utils/sanitization";
import { withSessionManagement } from "@/lib/utils/session-manager";
import { ensureNextResponse } from "@/lib/utils/response-converter";

/**
 * POST /api/orders
 * Create a new payment order and generate payment links
 */
export const POST = withStandardMiddleware(async (request: NextRequest): Promise<NextResponse> => {
  const response = await withRateLimit(request, rateLimiters.orderCreation, async () => {
    return withCSRFProtection(request, async () => {
      return withSessionManagement(request, async () => {
        // Get authenticated user from middleware
        const user = getUserFromRequest(request);
        if (!user) {
          throw new AuthenticationError("Authentication required");
        }
        const userId = user.id;

        // Connect to database
        await connectDB();

        // Parse and validate request body with sanitization
        const body = await request.json();
        const sanitizedBody = InputSanitizer.sanitizeObject(body);

        // Additional validation for critical fields
        if (!sanitizedBody.amount || sanitizedBody.amount <= 0) {
          throw new Error("Invalid amount");
        }
        
        if (!sanitizedBody.vpa || !/^[\w.-]+@[\w.-]+$/.test(sanitizedBody.vpa)) {
          throw new Error("Invalid VPA format");
        }

        const validatedData = validateRequestBody(
          {
            ...sanitizedBody,
            amount: sanitizedBody.amount,
            vpa: sanitizedBody.vpa,
            merchantName: sanitizedBody.merchantName,
            createdBy: userId,
          },
          CreateOrderSchema
        );

        // Get system settings for timer duration and UPI configuration
        const settings = await SystemSettings.getSettings();

        // Use static UPI ID if configured, otherwise use provided VPA
        const vpa = settings.staticUpiId || validatedData.vpa;

        // Generate unique order ID
        const orderId = generateOrderId();

        // Calculate expiration time based on system settings
        const expiresAt = new Date(Date.now() + settings.getTimerDurationMs());

        // Generate payment page URL
        const paymentPageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pay/${orderId}`;

        // Generate UPI links for enabled apps
        const enabledApps = settings.getEnabledApps();
        const upiLinks = generateAllUpiLinks(
          {
            vpa,
            amount: validatedData.amount,
            merchantName: validatedData.merchantName,
            orderId,
            note: `Payment to ${validatedData.merchantName}`,
          },
          enabledApps
        );

        // Extract client metadata
        const clientIP =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        const referrer = request.headers.get("referer") || "";

        // Create order in database
        const order = await Order.create({
          orderId,
          amount: validatedData.amount,
          merchantName: validatedData.merchantName,
          vpa,
          status: "pending",
          createdBy: userId,
          expiresAt,
          paymentPageUrl,
          upiDeepLink: upiLinks.standard,
          metadata: {
            customerIP: clientIP,
            userAgent,
            referrer,
          },
        });

        // Log order creation for audit trail
        await logOrderCreation(
          orderId,
          userId,
          {
            amount: validatedData.amount,
            merchantName: validatedData.merchantName,
            vpa,
          },
          {
            ipAddress: clientIP,
            userAgent,
          }
        );

        // Return success response with order details
        return NextResponse.json(
          {
            success: true,
            message: "Order created successfully",
            data: {
              orderId: order.orderId,
              paymentPageUrl: order.paymentPageUrl,
              upiLinks,
              expiresAt: order.expiresAt,
              amount: order.amount,
              merchantName: order.merchantName,
              vpa: order.vpa,
            },
          },
          { status: 201 }
        );
      });
    });
  });
  return ensureNextResponse(response);
});

/**
 * GET /api/orders
 * Get orders for the authenticated user (merchants see their own, admins see all)
 */
export const GET = withStandardMiddleware(async (request: NextRequest): Promise<NextResponse> => {
  const response = await withRateLimit(request, rateLimiters.general, async () => {
    return withSessionManagement(request, async () => {
      // Authenticate user
      const { userId, sessionClaims } = await auth();
      if (!userId) {
        throw new AuthenticationError();
      }

      // Connect to database
      await connectDB();

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url);
      const querySchema = z.object({
        status: z
          .enum([
            "pending",
            "pending-verification",
            "completed",
            "expired",
            "failed",
          ])
          .optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
      });

      const queryParams = Object.fromEntries(searchParams.entries());
      const { status, page, limit } = querySchema.parse(queryParams);
      const skip = (page - 1) * limit;

      // Check user role
      const userRole = (sessionClaims?.metadata as ClerkUserMetadata)?.role;
      const isAdmin = userRole === "admin";

      // Build query based on user role
      let query: any = {};
      if (!isAdmin) {
        // Non-admin users can only see their own orders
        query.createdBy = userId;
      }

      if (status) {
        query.status = status;
      }

      // Get orders with pagination
      const [orders, totalCount] = await Promise.all([
        Order.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return NextResponse.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit,
          },
        },
      });
    });
  });
  return ensureNextResponse(response);
});
