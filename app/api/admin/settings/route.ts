import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import { z } from "zod";
import {
  getSystemSettings,
  updateSystemSettings,
  resetSettingsToDefaults,
} from "@/lib/db/queries/settings";

// Validation schema for settings updates
const UpdateSettingsSchema = z.object({
  timerDuration: z.number().min(1).max(60).optional(),
  staticUpiId: z
    .string()
    .regex(/^[\w.-]+@[\w.-]+$/)
    .optional()
    .or(z.literal("")),
  enabledUpiApps: z
    .object({
      gpay: z.boolean().optional(),
      phonepe: z.boolean().optional(),
      paytm: z.boolean().optional(),
      bhim: z.boolean().optional(),
    })
    .optional(),
});

// GET /api/admin/settings - Get current system settings
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    const settings = await getSystemSettings();

    return NextResponse.json({
      success: true,
      data: {
        timerDuration: settings.timerDuration,
        staticUpiId: settings.staticUpiId || "",
        enabledUpiApps: settings.enabledUpiApps,
        updatedBy: settings.updatedBy,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    const body = await request.json();

    // Validate request body
    const validationResult = UpdateSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Convert empty string to undefined for staticUpiId
    if (updates.staticUpiId === "") {
      updates.staticUpiId = undefined;
    }

    // Get client IP and user agent for audit logging
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const updatedSettings = await updateSystemSettings(updates, auth.userId!, {
      ipAddress: clientIP,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: {
        timerDuration: updatedSettings.timerDuration,
        staticUpiId: updatedSettings.staticUpiId || "",
        enabledUpiApps: updatedSettings.enabledUpiApps,
        updatedBy: updatedSettings.updatedBy,
        updatedAt: updatedSettings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating settings:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/reset - Reset settings to defaults
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    // Get client IP and user agent for audit logging
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const resetSettings = await resetSettingsToDefaults(auth.userId!, {
      ipAddress: clientIP,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults successfully",
      data: {
        timerDuration: resetSettings.timerDuration,
        staticUpiId: resetSettings.staticUpiId || "",
        enabledUpiApps: resetSettings.enabledUpiApps,
        updatedBy: resetSettings.updatedBy,
        updatedAt: resetSettings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error resetting settings:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to reset settings" },
      { status: 500 }
    );
  }
}
