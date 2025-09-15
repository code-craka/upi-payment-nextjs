import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth/utils";
import { logUserAction } from "@/lib/db/queries/audit-logs";
import { z } from "zod";

// Schema for updating user role
const UpdateUserRoleSchema = z.object({
  role: z.enum(["admin", "merchant", "viewer"], {
    errorMap: () => ({ message: "Role must be admin, merchant, or viewer" }),
  }),
});

// PUT /api/admin/users/[userId] - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    const { userId: targetUserId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateUserRoleSchema.parse(body);

    // Get target user
    const clerk = await clerkClient();
    const targetUser = await clerk.users.getUser(targetUserId);
    const oldRole = targetUser.publicMetadata?.role || "viewer";

    // Update user role
    await clerk.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: validatedData.role,
      },
    });

    // Log role update
    await logUserAction(
      "user_role_updated",
      targetUserId,
      auth.userId!,
      {
        oldRole,
        newRole: validatedData.role,
        email: targetUser.emailAddresses[0]?.emailAddress,
      },
      {
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    );

    // Get updated user
    const updatedUser = await clerk.users.getUser(targetUserId);

    // Format response
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress || "",
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      role: updatedUser.publicMetadata?.role || "viewer",
      createdAt: updatedUser.createdAt,
      lastSignInAt: updatedUser.lastSignInAt,
      imageUrl: updatedUser.imageUrl,
    };

    return NextResponse.json({
      user: userResponse,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    requireAdmin(auth);

    const { userId: targetUserId } = await params;

    // Prevent self-deletion
    if (auth.userId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get target user before deletion for logging
    const clerk = await clerkClient();
    const targetUser = await clerk.users.getUser(targetUserId);

    // Delete user from Clerk
    await clerk.users.deleteUser(targetUserId);

    // Log user deletion
    await logUserAction(
      "user_deleted",
      targetUserId,
      auth.userId!,
      {
        email: targetUser.emailAddresses[0]?.emailAddress,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.publicMetadata?.role,
      },
      {
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    );

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
