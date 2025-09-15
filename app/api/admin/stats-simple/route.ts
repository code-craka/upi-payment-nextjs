import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";

// GET /api/admin/stats-simple - Simple admin stats without complex queries
export async function GET(request: NextRequest) {
  try {
    console.log("=== Simple Admin Stats API Debug ===");
    const auth = await authenticateRequest(request);
    console.log("Simple stats - Auth result:", {
      isAuthenticated: auth.isAuthenticated,
      role: auth.role,
      userId: auth.userId,
    });

    requireAdmin(auth);
    console.log("Simple stats - Admin check passed");

    // Return simple mock data to test if the issue is with the database queries
    const stats = {
      overview: {
        totalUsers: 1,
        totalOrders: 1,
        pendingVerification: 0,
        successRate: 100,
        recentOrders: 1,
      },
      ordersByStatus: {
        pending: 0,
        completed: 1,
        failed: 0,
        expired: 0,
        "pending-verification": 0,
      },
      userStats: [],
      recentActivity: [],
      pendingOrders: [],
    };

    console.log("Simple stats - Returning data:", stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error in simple admin stats:", error);
    console.error("Error type:", typeof error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown"
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      console.log("Simple stats - Returning 403 for admin access required");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch simple statistics" },
      { status: 500 }
    );
  }
}
