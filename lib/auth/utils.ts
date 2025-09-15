import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { boolean } from "zod";

export interface AuthResult {
  userId: string | null;
  user: any | null;
  role: "admin" | "merchant" | "viewer" | null;
  isAuthenticated: boolean;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        userId: null,
        user: null,
        role: null,
        isAuthenticated: false,
      };
    }

    const user = await currentUser();

    // Extract role from publicMetadata - ensure this matches how roles are stored in Clerk
    const role = user?.publicMetadata?.role as
      | "admin"
      | "merchant"
      | "viewer"
      | undefined;

    // Validate the role
    const validRole =
      role && ["admin", "merchant", "viewer"].includes(role)
        ? (role as "admin" | "merchant" | "viewer")
        : null;

    return {
      userId,
      user,
      role: validRole,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      userId: null,
      user: null,
      role: null,
      isAuthenticated: false,
    };
  }
}

// Helper function to check if user has admin role
export function requireAdmin(auth: AuthResult): void {
  if (!auth.isAuthenticated || auth.role !== "admin") {
    throw new Error("Admin access required");
  }
}

// Helper function to check if user has specific role
export function requireRole(
  auth: AuthResult,
  role: "admin" | "merchant" | "viewer"
): void {
  if (!auth.isAuthenticated || auth.role !== role) {
    throw new Error(`Role ${role} required`);
  }
}
