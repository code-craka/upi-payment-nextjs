import type { User } from "@clerk/nextjs/server";
import type { UserResource } from "@clerk/types";

// Define user roles
export type UserRole = "admin" | "merchant" | "viewer";

// Define permissions for each role
export const rolePermissions = {
  admin: [
    "create_user",
    "delete_user",
    "view_all_orders",
    "update_settings",
    "manage_users",
    "verify_orders",
    "view_analytics",
    "create_order",
    "view_own_orders",
  ],
  merchant: ["create_order", "view_own_orders", "manage_own_links"],
  viewer: ["view_assigned_orders"],
} as const;

export type Permission = (typeof rolePermissions)[UserRole][number];

// Union type for both server and client user types
type ClerkUser = User | UserResource | null | undefined;

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
