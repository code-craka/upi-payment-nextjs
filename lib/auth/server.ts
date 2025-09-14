import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getUserRole,
  hasPermission,
  requirePermission,
  requireAdmin,
  type Permission,
  type UserRole,
} from "./permissions";

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * Get current user's auth info
 */
export async function getCurrentAuth() {
  return await auth();
}

/**
 * Require authentication or redirect to sign-in
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

/**
 * Get authenticated user or redirect to sign-in
 */
export async function getAuthenticatedUser() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Require specific role or redirect
 */
export async function requireRole(role: UserRole, redirectTo: string = "/") {
  const user = await currentUser();
  const userRole = getUserRole(user);

  if (userRole !== role && userRole !== "admin") {
    redirect(redirectTo);
  }

  return user!;
}

/**
 * Require admin role or redirect
 */
export async function requireAdminRole(redirectTo: string = "/") {
  const user = await currentUser();

  try {
    requireAdmin(user);
    return user!;
  } catch {
    redirect(redirectTo);
  }
}

/**
 * Require specific permission or redirect
 */
export async function requirePermissionOrRedirect(
  permission: Permission,
  redirectTo: string = "/"
) {
  const user = await currentUser();

  try {
    requirePermission(user, permission);
    return user!;
  } catch {
    redirect(redirectTo);
  }
}

/**
 * Check if current user has permission (server-side)
 */
export async function currentUserHasPermission(
  permission: Permission
): Promise<boolean> {
  const user = await currentUser();
  return hasPermission(user, permission);
}

/**
 * Get current user's role (server-side)
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  return getUserRole(user);
}
