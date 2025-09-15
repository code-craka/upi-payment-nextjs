import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import { getOrderStats, getAllOrders } from "@/lib/db/queries/orders";
import { getUserStats, getRecentActivity } from "@/lib/db/queries/audit-logs";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    console.log("=== Admin Stats API Debug ===");
    const auth = await authenticateRequest(request);
    console.log("Admin stats - Auth result:", {
      isAuthenticated: auth.isAuthenticated,
      role: auth.role,
      userId: auth.userId,
    });

    requireAdmin(auth);
    console.log("Admin stats - Admin check passed");

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Fetch all required data in parallel with better error handling
    const clerk = await clerkClient();

    let orderStats, userCount, userActivityStats, recentActivity, pendingOrders;

    try {
      [
        orderStats,
        userCount,
        userActivityStats,
        recentActivity,
        pendingOrders,
      ] = await Promise.all([
        getOrderStats().catch((err) => {
          console.error("Error fetching order stats:", err);
          return { total: 0, byStatus: {}, recentCount: 0 };
        }),
        clerk.users.getCount().catch((err) => {
          console.error("Error fetching user count:", err);
          return 0;
        }),
        getUserStats({ startDate, endDate, limit: 10 }).catch((err) => {
          console.error("Error fetching user stats:", err);
          return [];
        }),
        getRecentActivity({ limit: 20, startDate, endDate }).catch((err) => {
          console.error("Error fetching recent activity:", err);
          return [];
        }),
        getAllOrders({ status: "pending-verification", limit: 10 }).catch(
          (err) => {
            console.error("Error fetching pending orders:", err);
            return { orders: [], pagination: { totalCount: 0 } };
          }
        ),
      ]);
    } catch (error) {
      console.error("Error in parallel data fetch:", error);
      throw error;
    }

    // Get user details for activity stats
    const userIds = userActivityStats.map((stat) => stat.userId);
    const userDetails = await Promise.all(
      userIds.map(async (id: string) => {
        try {
          const user = await clerk.users.getUser(id);
          return {
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown User",
            email: user.emailAddresses[0]?.emailAddress || "",
            role: user.publicMetadata?.role || "viewer",
          };
        } catch (error) {
          return {
            id,
            name: "Unknown User",
            email: "",
            role: "viewer",
          };
        }
      })
    );

    // Combine user stats with user details
    const userStatsWithDetails = userActivityStats.map((stat) => {
      const userDetail = userDetails.find((user) => user.id === stat.userId);
      return {
        ...stat,
        userName: userDetail?.name || "Unknown User",
        userEmail: userDetail?.email || "",
        userRole: userDetail?.role || "viewer",
      };
    });

    // Format recent activity with user names
    const activityUserIds = [
      ...new Set(recentActivity.map((activity) => activity.userId)),
    ];
    const activityUserDetails = await Promise.all(
      activityUserIds.map(async (id: string) => {
        try {
          const user = await clerk.users.getUser(id);
          return {
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown User",
          };
        } catch (error) {
          return {
            id,
            name: "Unknown User",
          };
        }
      })
    );

    const recentActivityWithNames = recentActivity.map((activity) => {
      const userDetail = activityUserDetails.find(
        (user) => user.id === activity.userId
      );
      return {
        ...activity,
        userName: userDetail?.name || "Unknown User",
      };
    });

    // Calculate success rate
    const totalCompleted = orderStats.byStatus.completed || 0;
    const totalFailed = orderStats.byStatus.failed || 0;
    const totalProcessed = totalCompleted + totalFailed;
    const successRate =
      totalProcessed > 0 ? (totalCompleted / totalProcessed) * 100 : 0;

    // Prepare response
    const stats = {
      overview: {
        totalUsers: userCount,
        totalOrders: orderStats.total,
        pendingVerification: orderStats.byStatus["pending-verification"] || 0,
        successRate: Math.round(successRate * 100) / 100,
        recentOrders: orderStats.recentCount,
      },
      ordersByStatus: orderStats.byStatus,
      userStats: userStatsWithDetails,
      recentActivity: recentActivityWithNames,
      pendingOrders: pendingOrders.orders.map((order) => ({
        orderId: order.orderId,
        amount: order.amount,
        merchantName: order.merchantName,
        utr: order.utr,
        createdAt: order.createdAt,
        createdBy: order.createdBy,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error
    );

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      console.log("Returning 403 for admin access required");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
