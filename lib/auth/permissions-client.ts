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

// Client-side user type
type ClerkUser = UserResource | null | undefined;

/**
 * Get user role from Clerk user metadata (client-side)
 */
export function getUserRole(user: ClerkUser): UserRole | null {
  if (!user) return null;

  const role = user.publicMetadata?.role as UserRole;
  return role && Object.keys(rolePermissions).includes(role) ? role : null;
}

/**
 * Check if user has specific permission (client-side)
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
 * Check if user has admin role (client-side)
 */
export function isAdmin(user: ClerkUser): boolean {
  return getUserRole(user) === "admin";
}

/**
 * Check if user has merchant role (client-side)
 */
export function isMerchant(user: ClerkUser): boolean {
  const role = getUserRole(user);
  return role === "merchant" || role === "admin";
}

/**
 * Check if user has viewer role (client-side)
 */
export function isViewer(user: ClerkUser): boolean {
  const role = getUserRole(user);
  return role === "viewer" || role === "merchant" || role === "admin";
}

/**
 * Get all permissions for a user (client-side)
 */
export function getUserPermissions(user: ClerkUser): Permission[] {
  const role = getUserRole(user);
  if (!role) return [];

  return [...rolePermissions[role]];
}
