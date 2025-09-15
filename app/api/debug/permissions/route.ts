import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { hasPermissionByUserId } from "@/lib/auth/permissions";
import { getUserRole, hasPermission } from "@/lib/auth/permissions-client";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
      });
    }

    const user = await currentUser();

    // Test different permission checks
    const permissions = [
      "view_analytics",
      "update_settings",
      "view_all_orders",
      "manage_users",
    ];

    const permissionResults = {};

    for (const permission of permissions) {
      try {
        const hasPermissionResult = await hasPermissionByUserId(
          userId,
          permission as any
        );
        permissionResults[permission] = {
          hasPermission: hasPermissionResult,
          error: null,
        };
      } catch (error) {
        permissionResults[permission] = {
          hasPermission: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // Also test client-side permission check
    const clientSideRole = getUserRole(user as any);
    const clientSideHasViewAnalytics = hasPermission(
      user as any,
      "view_analytics" as any
    );

    return NextResponse.json({
      authenticated: true,
      userId: userId,
      user: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.emailAddresses?.[0]?.emailAddress,
      },
      roleInfo: {
        sessionClaimsRole: (sessionClaims?.metadata as any)?.role,
        publicMetadataRole: user?.publicMetadata?.role,
        clientSideRole: clientSideRole,
      },
      permissionTests: permissionResults,
      clientSideTests: {
        role: clientSideRole,
        hasViewAnalytics: clientSideHasViewAnalytics,
      },
    });
  } catch (error) {
    console.error("Error in permission debug:", error);
    return NextResponse.json(
      {
        error: "Failed to debug permissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
