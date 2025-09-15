import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Auth Test Debug ===");

    const auth = await authenticateRequest(request);

    console.log("Auth result:", {
      isAuthenticated: auth.isAuthenticated,
      userId: auth.userId,
      role: auth.role,
      userEmail: auth.user?.emailAddresses?.[0]?.emailAddress,
    });

    // Test requireAdmin
    try {
      requireAdmin(auth);
      console.log("RequireAdmin: PASSED");

      return NextResponse.json({
        success: true,
        message: "Admin access granted",
        auth: {
          isAuthenticated: auth.isAuthenticated,
          userId: auth.userId,
          role: auth.role,
          userEmail: auth.user?.emailAddresses?.[0]?.emailAddress,
        },
      });
    } catch (adminError) {
      console.log("RequireAdmin: FAILED -", adminError.message);

      return NextResponse.json(
        {
          success: false,
          message: "Admin access denied",
          error: adminError.message,
          auth: {
            isAuthenticated: auth.isAuthenticated,
            userId: auth.userId,
            role: auth.role,
            userEmail: auth.user?.emailAddresses?.[0]?.emailAddress,
          },
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
