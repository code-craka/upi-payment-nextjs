import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { hasPermissionByUserId } from "@/lib/auth/permissions";
import { getSettingsHistory } from "@/lib/db/queries/settings";

// GET /api/admin/settings/history - Get settings change history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    if (!(await hasPermissionByUserId(userId, "update_settings"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await getSettingsHistory(limit);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching settings history:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings history" },
      { status: 500 }
    );
  }
}
