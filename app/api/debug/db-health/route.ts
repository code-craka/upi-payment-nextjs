import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Order from "@/lib/db/models/order";
import SystemSettings from "@/lib/db/models/settings";
import AuditLog from "@/lib/db/models/audit-log";

export async function GET() {
  try {
    // Test database connection
    await connectDB();

    // Test each collection
    const [orderCount, settingsExists, auditLogCount] = await Promise.all([
      Order.countDocuments(),
      SystemSettings.findOne(),
      AuditLog.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        collections: {
          orders: {
            count: orderCount,
            status: "✅ Connected",
          },
          settings: {
            exists: !!settingsExists,
            status: settingsExists
              ? "✅ Settings found"
              : "⚠️ No settings (will create defaults)",
          },
          auditLogs: {
            count: auditLogCount,
            status: "✅ Connected",
          },
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
