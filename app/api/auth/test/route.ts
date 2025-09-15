import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/utils";
import { getUserRole, hasPermission } from "@/lib/auth/permissions";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request as any);

    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const role = getUserRole(auth.user);

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.primaryEmailAddress?.emailAddress,
        firstName: auth.user.firstName,
        lastName: auth.user.lastName,
        role: role,
        permissions: {
          canCreateOrder: hasPermission(auth.user, "create_order"),
          canViewAllOrders: hasPermission(auth.user, "view_all_orders"),
          canManageUsers: hasPermission(auth.user, "manage_users"),
          canUpdateSettings: hasPermission(auth.user, "update_settings"),
        },
      },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
