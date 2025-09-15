import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import {
  getActionStats,
  getUserStats,
  getOrderActivity,
  getUserManagementActivity,
  getSettingsActivity,
} from "@/lib/db/queries/audit-logs";
import { getOrderStats } from "@/lib/db/queries/orders";
import { clerkClient } from "@clerk/nextjs/server";

// GET /api/admin/analytics - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date(); // Default: now

    // Fetch analytics data in parallel
    const [
      actionStats,
      userActivityStats,
      orderActivity,
      userManagementActivity,
      settingsActivity,
      orderStats,
    ] = await Promise.all([
      getActionStats(startDate, endDate),
      getUserStats({ startDate, endDate, limit: 20 }),
      getOrderActivity(undefined, { startDate, endDate, limit: 100 }),
      getUserManagementActivity({ startDate, endDate, limit: 50 }),
      getSettingsActivity({ startDate, endDate, limit: 20 }),
      getOrderStats(),
    ]);

    // Get user details for activity stats
    const clerk = await clerkClient();
    const userIds = [
      ...new Set([
        ...userActivityStats.map((stat) => stat.userId),
        ...orderActivity.map((activity) => activity.userId),
        ...userManagementActivity.map((activity) => activity.userId),
        ...settingsActivity.map((activity) => activity.userId),
      ]),
    ];

    const userDetails = await Promise.all(
      userIds.map(async (id) => {
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

    // Create user lookup map
    const userLookup = userDetails.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, (typeof userDetails)[0]>
    );

    // Enhance user activity stats with user details
    const enhancedUserStats = userActivityStats.map((stat) => ({
      ...stat,
      userName: userLookup[stat.userId]?.name || "Unknown User",
      userEmail: userLookup[stat.userId]?.email || "",
      userRole: userLookup[stat.userId]?.role || "viewer",
    }));

    // Enhance activity logs with user details
    const enhancedOrderActivity = orderActivity.map((activity) => ({
      ...activity,
      userName: userLookup[activity.userId]?.name || "Unknown User",
    }));

    const enhancedUserManagementActivity = userManagementActivity.map(
      (activity) => ({
        ...activity,
        userName: userLookup[activity.userId]?.name || "Unknown User",
      })
    );

    const enhancedSettingsActivity = settingsActivity.map((activity) => ({
      ...activity,
      userName: userLookup[activity.userId]?.name || "Unknown User",
    }));

    // Calculate conversion metrics
    const totalOrders = orderStats.total;
    const completedOrders = orderStats.byStatus.completed || 0;
    const failedOrders = orderStats.byStatus.failed || 0;
    const pendingVerification =
      orderStats.byStatus["pending-verification"] || 0;
    const expiredOrders = orderStats.byStatus.expired || 0;

    const conversionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const failureRate =
      totalOrders > 0 ? (failedOrders / totalOrders) * 100 : 0;
    const verificationPendingRate =
      totalOrders > 0 ? (pendingVerification / totalOrders) * 100 : 0;

    // Calculate activity trends by day
    const activityByDay = actionStats.reduce(
      (acc, stat) => {
        const day = stat.lastOccurrence.toISOString().split("T")[0];
        if (!acc[day]) {
          acc[day] = { date: day, totalActions: 0, actionBreakdown: {} };
        }
        acc[day].totalActions += stat.count;
        acc[day].actionBreakdown[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, any>
    );

    // Top performing merchants (users with most successful orders)
    const merchantPerformance = enhancedUserStats
      .filter((stat) => stat.userRole === "merchant")
      .map((stat) => ({
        userId: stat.userId,
        userName: stat.userName,
        userEmail: stat.userEmail,
        totalOrders: stat.actionBreakdown.order_created || 0,
        completedOrders: stat.actionBreakdown.order_status_updated || 0,
        successRate:
          stat.actionBreakdown.order_created > 0
            ? ((stat.actionBreakdown.order_status_updated || 0) /
                stat.actionBreakdown.order_created) *
              100
            : 0,
        lastActivity: stat.lastActivity,
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);

    // System health metrics
    const systemHealth = {
      totalUsers: userDetails.length,
      activeUsers: enhancedUserStats.length,
      totalOrders,
      conversionRate: Math.round(conversionRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      verificationPendingRate: Math.round(verificationPendingRate * 100) / 100,
      avgOrdersPerUser:
        enhancedUserStats.length > 0
          ? Math.round((totalOrders / enhancedUserStats.length) * 100) / 100
          : 0,
    };

    // Prepare comprehensive analytics response
    const analytics = {
      dateRange: {
        startDate,
        endDate,
      },
      systemHealth,
      actionStats: actionStats.map((stat) => ({
        action: stat._id,
        count: stat.count,
        lastOccurrence: stat.lastOccurrence,
      })),
      userActivityStats: enhancedUserStats,
      merchantPerformance,
      orderMetrics: {
        total: totalOrders,
        byStatus: orderStats.byStatus,
        conversionRate,
        failureRate,
        verificationPendingRate,
      },
      activityTimeline: {
        orderActivity: enhancedOrderActivity.slice(0, 50),
        userManagementActivity: enhancedUserManagementActivity.slice(0, 20),
        settingsActivity: enhancedSettingsActivity.slice(0, 10),
      },
      trends: {
        activityByDay: Object.values(activityByDay).sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
