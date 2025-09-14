/**
 * Order Expiration Utilities
 * Handles automatic expiration of pending orders
 */

import connectDB from "@/lib/db/connection";
import Order from "@/lib/db/models/order";

/**
 * Mark expired orders as expired
 * This should be called periodically (e.g., via cron job or API endpoint)
 */
export async function markExpiredOrders(): Promise<{
  expiredCount: number;
  expiredOrderIds: string[];
}> {
  try {
    await connectDB();

    // Find all pending orders that have expired
    const expiredOrders = await Order.find({
      status: "pending",
      expiresAt: { $lt: new Date() },
    });

    const expiredOrderIds: string[] = [];

    // Update each expired order
    for (const order of expiredOrders) {
      order.status = "expired";
      order.metadata = {
        ...order.metadata,
        expiredAt: new Date(),
        expiredBy: "system",
      };
      await order.save();
      expiredOrderIds.push(order.orderId);
    }

    console.log(
      `Marked ${expiredOrders.length} orders as expired:`,
      expiredOrderIds
    );

    return {
      expiredCount: expiredOrders.length,
      expiredOrderIds,
    };
  } catch (error) {
    console.error("Error marking expired orders:", error);
    throw error;
  }
}

/**
 * Check if a specific order is expired and update if needed
 */
export async function checkAndUpdateOrderExpiration(orderId: string): Promise<{
  wasExpired: boolean;
  currentStatus: string;
}> {
  try {
    await connectDB();

    const order = await Order.findByOrderId(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const wasExpired = order.isExpired() && order.status === "pending";

    if (wasExpired) {
      order.status = "expired";
      order.metadata = {
        ...order.metadata,
        expiredAt: new Date(),
        expiredBy: "system",
      };
      await order.save();
    }

    return {
      wasExpired,
      currentStatus: order.status,
    };
  } catch (error) {
    console.error("Error checking order expiration:", error);
    throw error;
  }
}

/**
 * Get orders that will expire soon (within specified minutes)
 */
export async function getOrdersExpiringSoon(withinMinutes: number = 5): Promise<
  {
    orderId: string;
    merchantName: string;
    amount: number;
    expiresAt: Date;
    minutesRemaining: number;
  }[]
> {
  try {
    await connectDB();

    const now = new Date();
    const futureTime = new Date(now.getTime() + withinMinutes * 60 * 1000);

    const expiringSoonOrders = await Order.find({
      status: "pending",
      expiresAt: {
        $gt: now,
        $lte: futureTime,
      },
    }).select("orderId merchantName amount expiresAt");

    return expiringSoonOrders.map((order) => ({
      orderId: order.orderId,
      merchantName: order.merchantName,
      amount: order.amount,
      expiresAt: order.expiresAt,
      minutesRemaining: Math.floor(
        (order.expiresAt.getTime() - now.getTime()) / (60 * 1000)
      ),
    }));
  } catch (error) {
    console.error("Error fetching orders expiring soon:", error);
    throw error;
  }
}

/**
 * Clean up old expired orders (optional - for data retention)
 */
export async function cleanupOldExpiredOrders(
  olderThanDays: number = 30
): Promise<{
  deletedCount: number;
}> {
  try {
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await Order.deleteMany({
      status: "expired",
      expiresAt: { $lt: cutoffDate },
    });

    console.log(`Cleaned up ${result.deletedCount} old expired orders`);

    return {
      deletedCount: result.deletedCount || 0,
    };
  } catch (error) {
    console.error("Error cleaning up old expired orders:", error);
    throw error;
  }
}

/**
 * Get expiration statistics
 */
export async function getExpirationStats(): Promise<{
  totalPending: number;
  totalExpired: number;
  expiredToday: number;
  expiringSoon: number;
}> {
  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const soonTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const [totalPending, totalExpired, expiredToday, expiringSoon] =
      await Promise.all([
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "expired" }),
        Order.countDocuments({
          status: "expired",
          "metadata.expiredAt": { $gte: todayStart },
        }),
        Order.countDocuments({
          status: "pending",
          expiresAt: { $gt: now, $lte: soonTime },
        }),
      ]);

    return {
      totalPending,
      totalExpired,
      expiredToday,
      expiringSoon,
    };
  } catch (error) {
    console.error("Error fetching expiration stats:", error);
    throw error;
  }
}
