// Re-export from new type-safe system
export type { UserRole, Permission, SafeUser, AuthResult } from "./types";
export { rolePermissions } from "./types";

// Re-export safe authentication functions
export {
  getSafeUser,
  getSafeAuth,
  requireAuth,
  requireAuthOrRedirect,
  requireRole,
  requireRoleOrRedirect,
  requireAdmin,
  requireAdminOrRedirect,
  requirePermission,
  requirePermissionOrRedirect,
  currentUserHasPermission,
  currentUserHasRole,
  getSafeUserById,
  authenticateRequest,
  withAuth,
  withRole,
  withPermission,
  withAdmin,
  getAuthContext,
} from "./safe-auth";

// Re-export adapter functions
export {
  adaptClerkUser,
  adaptClerkUserResource,
  getUserDisplayName,
  getUserInitials,
  hasRole,
  hasPermission as hasUserPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleLevel,
  validateUserIntegrity,
  sanitizeUserForClient,
} from "./adapters";

// Legacy compatibility functions (deprecated - use safe-auth instead)
import type { User } from "@clerk/nextjs/server";
import { adaptClerkUser } from "./adapters";
import type { UserRole, Permission } from "./types";

/**
 * @deprecated Use getSafeUser() from safe-auth instead
 */
export function getUserRole(user: User | null): UserRole | null {
  const safeUser = adaptClerkUser(user);
  return safeUser?.role || null;
}

/**
 * @deprecated Use hasUserPermission() from adapters instead
 */
export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  const safeUser = adaptClerkUser(user);
  return safeUser?.permissions.includes(permission) || false;
}

/**
 * @deprecated Use getSafeUserById() and hasUserPermission() instead
 */
export async function hasPermissionByUserId(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return hasPermission(user, permission);
  } catch (error) {
    console.error("Error fetching user for permission check:", error);
    return false;
  }
}

/**
 * @deprecated Use hasRole() from adapters instead
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === "admin";
}

/**
 * @deprecated Use hasRoleLevel() from adapters instead
 */
export function isMerchant(user: User | null): boolean {
  const role = getUserRole(user);
  return role === "merchant" || role === "admin";
}

/**
 * @deprecated Use hasRoleLevel() from adapters instead
 */
export function isViewer(user: User | null): boolean {
  const role = getUserRole(user);
  return role === "viewer" || role === "merchant" || role === "admin";
}

/**
 * @deprecated Use requirePermission() from safe-auth instead
 */
export function requirePermissionLegacy(
  user: User | null,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Access denied. Required permission: ${permission}`);
  }
}

/**
 * @deprecated Use requireAdmin() from safe-auth instead
 */
export function requireAdminLegacy(user: User | null): void {
  if (!isAdmin(user)) {
    throw new Error("Access denied. Admin role required.");
  }
}

/**
 * @deprecated Use SafeUser.permissions instead
 */
export function getUserPermissions(user: User | null): Permission[] {
  const safeUser = adaptClerkUser(user);
  return safeUser?.permissions || [];
}
