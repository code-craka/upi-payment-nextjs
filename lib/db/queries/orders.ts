import connectDB from "../connection";
import Order, { IOrder, CreateOrderSchema } from "../models/order";
import AuditLog from "../models/audit-log";
import SystemSettings from "../models/settings";
import { z } from "zod";

// Connect to database before operations
const ensureConnection = async () => {
  await connectDB();
};

// Order creation with validation and audit logging
export const createOrder = async (
  orderData: z.infer<typeof CreateOrderSchema>,
  options: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  } = {}
): Promise<IOrder> => {
  await ensureConnection();

  // Validate input
  const validatedData = CreateOrderSchema.parse(orderData);

  // Get system settings for timer duration
  const settings = await SystemSettings.getSettings();

  // Generate unique order ID
  const orderId = `UPI${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + settings.getTimerDurationMs());

  // Use static UPI ID if configured, otherwise use provided VPA
  const vpa = settings.staticUpiId || validatedData.vpa;

  // Generate payment page URL and UPI deep link
  const paymentPageUrl = `/pay/${orderId}`;
  const upiDeepLink = `upi://pay?pa=${vpa}&am=${validatedData.amount}&tn=Payment%20to%20${encodeURIComponent(validatedData.merchantName)}`;

  // Create order
  const order = await Order.create({
    orderId,
    amount: validatedData.amount,
    merchantName: validatedData.merchantName,
    vpa,
    createdBy: validatedData.createdBy,
    expiresAt,
    paymentPageUrl,
    upiDeepLink,
    metadata: {
      customerIP: options.ipAddress,
      userAgent: options.userAgent,
      referrer: options.referrer,
    },
  });

  // Log audit event
  await AuditLog.logAction("order_created", "order", validatedData.createdBy, {
    entityId: orderId,
    details: {
      amount: validatedData.amount,
      merchantName: validatedData.merchantName,
      vpa,
    },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });

  return order;
};

// Get order by ID with expiration check
export const getOrderById = async (orderId: string): Promise<IOrder | null> => {
  await ensureConnection();

  const order = await Order.findByOrderId(orderId);

  if (!order) {
    return null;
  }

  // Auto-expire if needed
  if (order.isExpired() && order.status === "pending") {
    order.status = "expired";
    await order.save();

    // Log expiration
    await AuditLog.logAction("order_status_updated", "order", order.createdBy, {
      entityId: orderId,
      details: {
        oldStatus: "pending",
        newStatus: "expired",
        reason: "auto_expired",
      },
    });
  }

  return order;
};

// Submit UTR for an order
export const submitUTR = async (
  orderId: string,
  utr: string,
  userId?: string
): Promise<IOrder> => {
  await ensureConnection();

  const order = await Order.findByOrderId(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.canSubmitUTR()) {
    throw new Error("Cannot submit UTR for this order");
  }

  // Validate UTR format
  const { SubmitUTRSchema } = await import("../models/order");
  SubmitUTRSchema.parse({ utr });

  // Update order
  order.utr = utr;
  order.status = "pending-verification";
  await order.save();

  // Log audit event
  await AuditLog.logAction(
    "utr_submitted",
    "order",
    userId || order.createdBy,
    {
      entityId: orderId,
      details: {
        utr,
        previousStatus: "pending",
      },
    }
  );

  return order;
};

// Update order status (admin function)
export const updateOrderStatus = async (
  orderId: string,
  newStatus: IOrder["status"],
  updatedBy: string,
  reason?: string
): Promise<IOrder> => {
  await ensureConnection();

  const order = await Order.findByOrderId(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const oldStatus = order.status;
  order.status = newStatus;
  await order.save();

  // Log audit event
  await AuditLog.logAction("order_status_updated", "order", updatedBy, {
    entityId: orderId,
    details: {
      oldStatus,
      newStatus,
      reason,
    },
  });

  return order;
};

// Get orders by user with pagination
export const getOrdersByUser = async (
  createdBy: string,
  options: {
    status?: IOrder["status"];
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  orders: IOrder[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  await ensureConnection();

  const { status, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const query: any = { createdBy };
  if (status) query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// Get all orders (admin function) with pagination and filtering
export const getAllOrders = async (
  options: {
    status?: IOrder["status"];
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  orders: IOrder[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  await ensureConnection();

  const { status, page = 1, limit = 50, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const query: any = {};
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// Cleanup expired orders (background job)
export const cleanupExpiredOrders = async (): Promise<number> => {
  await ensureConnection();

  const expiredOrders = await Order.findExpiredOrders();

  let updatedCount = 0;
  for (const order of expiredOrders) {
    order.status = "expired";
    await order.save();

    // Log expiration
    await AuditLog.logAction("order_status_updated", "order", "system", {
      entityId: order.orderId,
      details: {
        oldStatus: "pending",
        newStatus: "expired",
        reason: "cleanup_job",
      },
    });

    updatedCount++;
  }

  return updatedCount;
};

// Get order statistics
export const getOrderStats = async (
  userId?: string
): Promise<{
  total: number;
  byStatus: Record<string, number>;
  recentCount: number;
}> => {
  await ensureConnection();

  const query = userId ? { createdBy: userId } : {};
  const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

  const [total, statusStats, recentCount] = await Promise.all([
    Order.countDocuments(query),
    Order.aggregate([
      ...(userId ? [{ $match: { createdBy: userId } }] : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.countDocuments({
      ...query,
      createdAt: { $gte: recentDate },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  statusStats.forEach((stat) => {
    byStatus[stat._id] = stat.count;
  });

  return {
    total,
    byStatus,
    recentCount,
  };
};
