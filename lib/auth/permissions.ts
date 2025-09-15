import type { User } from "@clerk/nextjs/server";

// Re-export types from client permissions
export type { UserRole, Permission } from "./permissions-client";
export { rolePermissions } from "./permissions-client";
import type { UserRole, Permission } from "./permissions-client";
import { rolePermissions } from "./permissions-client";

// Server-side user type
type ClerkUser = User | null | undefined;

/**
 * Get user role from Clerk user metadata
 */
export function getUserRole(user: ClerkUser): UserRole | null {
  if (!user) return null;

  const role = user.publicMetadata?.role as UserRole;
  return role && Object.keys(rolePermissions).includes(role) ? role : null;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: ClerkUser,
  permission: Permission
): boolean {
  const role = getUserRole(user);
  if (!role) return false;

  return (rolePermissions[role] as readonly string[]).includes(permission);
}

/**
 * Check if user has specific permission by userId (async version for server-side)
 */
export async function hasPermissionByUserId(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Debug logging
    console.log("Permission check for user:", userId);
    console.log("User role from publicMetadata:", user.publicMetadata?.role);
    console.log("Checking permission:", permission);

    const result = hasPermission(user, permission);
    console.log("Permission result:", result);

    return result;
  } catch (error) {
    console.error("Error fetching user for permission check:", error);
    return false;
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === "admin";
}

/**
 * Check if user has merchant role
 */
export function isMerchant(user: User | null): boolean {
  const role = getUserRole(user);
  return role === "merchant" || role === "admin";
}

/**
 * Check if user has viewer role
 */
export function isViewer(user: User | null): boolean {
  const role = getUserRole(user);
  return role === "viewer" || role === "merchant" || role === "admin";
}

/**
 * Require specific permission or throw error
 */
export function requirePermission(
  user: User | null,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Access denied. Required permission: ${permission}`);
  }
}

/**
 * Require admin role or throw error
 */
export function requireAdmin(user: User | null): void {
  if (!isAdmin(user)) {
    throw new Error("Access denied. Admin role required.");
  }
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null): Permission[] {
  const role = getUserRole(user);
  if (!role) return [];

  return [...rolePermissions[role]];
}
