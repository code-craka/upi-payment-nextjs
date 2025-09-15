import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import {
  getRecentActivity,
  getUserActivity,
  getEntityHistory,
  getActionStats,
} from "@/lib/db/queries/audit-logs";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

// Schema for query parameters
const AuditLogQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().optional(),
  action: z
    .enum([
      "order_created",
      "order_status_updated",
      "utr_submitted",
      "user_created",
      "user_deleted",
      "user_role_updated",
      "settings_updated",
      "login_attempt",
      "logout",
    ])
    .optional(),
  entityType: z.enum(["order", "user", "settings", "auth"]).optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/admin/audit-logs - Get audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = AuditLogQuerySchema.parse(queryParams);

    const {
      page,
      limit,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
    } = validatedQuery;

    // Convert date strings to Date objects
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    let auditLogs;
    let totalCount = 0;

    if (entityId && entityType) {
      // Get history for specific entity
      auditLogs = await getEntityHistory(entityType, entityId);
      totalCount = auditLogs.length;

      // Apply pagination manually for entity history
      const startIndex = (page - 1) * limit;
      auditLogs = auditLogs.slice(startIndex, startIndex + limit);
    } else if (userId) {
      // Get activity for specific user
      auditLogs = await getUserActivity(userId, limit * page);
      totalCount = auditLogs.length;

      // Apply pagination manually for user activity
      const startIndex = (page - 1) * limit;
      auditLogs = auditLogs.slice(startIndex, startIndex + limit);
    } else {
      // Get recent activity with filters
      const filters: any = {};
      if (action) filters.action = action;
      if (entityType) filters.entityType = entityType;
      if (startDateObj) filters.startDate = startDateObj;
      if (endDateObj) filters.endDate = endDateObj;

      // For pagination, we need to get more records and then slice
      const totalLimit = limit * page;
      const allLogs = await getRecentActivity({
        limit: totalLimit,
        ...filters,
      });

      totalCount = allLogs.length;
      const startIndex = (page - 1) * limit;
      auditLogs = allLogs.slice(startIndex, startIndex + limit);
    }

    // Get user details for all unique user IDs in the logs
    const clerk = await clerkClient();
    const userIds = [...new Set(auditLogs.map((log) => log.userId))];

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

    // Create user lookup map
    const userLookup = userDetails.reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, (typeof userDetails)[0]>
    );

    // Enhance audit logs with user details
    const enhancedLogs = auditLogs.map((log) => ({
      id: log._id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      userName: userLookup[log.userId]?.name || "Unknown User",
      userEmail: userLookup[log.userId]?.email || "",
      userRole: userLookup[log.userId]?.role || "viewer",
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      auditLogs: enhancedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      filters: {
        userId,
        action,
        entityType,
        entityId,
        startDate: startDateObj,
        endDate: endDateObj,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

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
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// GET /api/admin/audit-logs/stats - Get audit log statistics
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Parse request body for date range
    const body = await request.json();
    const { startDate, endDate } = body;

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // Get action statistics
    const actionStats = await getActionStats(startDateObj, endDateObj);

    // Calculate totals and percentages
    const totalActions = actionStats.reduce((sum, stat) => sum + stat.count, 0);

    const statsWithPercentages = actionStats.map((stat) => ({
      action: stat._id,
      count: stat.count,
      percentage:
        totalActions > 0
          ? Math.round((stat.count / totalActions) * 10000) / 100
          : 0,
      lastOccurrence: stat.lastOccurrence,
    }));

    // Group by category
    const categorizedStats = {
      orderActions: statsWithPercentages.filter((stat) =>
        ["order_created", "order_status_updated", "utr_submitted"].includes(
          stat.action
        )
      ),
      userActions: statsWithPercentages.filter((stat) =>
        ["user_created", "user_deleted", "user_role_updated"].includes(
          stat.action
        )
      ),
      systemActions: statsWithPercentages.filter((stat) =>
        ["settings_updated"].includes(stat.action)
      ),
      authActions: statsWithPercentages.filter((stat) =>
        ["login_attempt", "logout"].includes(stat.action)
      ),
    };

    return NextResponse.json({
      totalActions,
      dateRange: {
        startDate: startDateObj,
        endDate: endDateObj,
      },
      actionStats: statsWithPercentages,
      categorizedStats,
    });
  } catch (error) {
    console.error("Error fetching audit log stats:", error);

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
      { error: "Failed to fetch audit log statistics" },
      { status: 500 }
    );
  }
}
