import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserRole, hasPermission } from "@/lib/auth/permissions";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = getUserRole(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        role: role,
        permissions: {
          canCreateOrder: hasPermission(user, "create_order"),
          canViewAllOrders: hasPermission(user, "view_all_orders"),
          canManageUsers: hasPermission(user, "manage_users"),
          canUpdateSettings: hasPermission(user, "update_settings"),
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
