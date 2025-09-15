import type { User as ClerkUser } from "@clerk/nextjs/server";
import type { UserResource } from "@clerk/types";
import {
  SafeUser,
  UserRole,
  Permission,
  UserMetadata,
  SafeUserSchema,
  UserRoleSchema,
  rolePermissions,
  AuthError,
  isClerkUser,
  isClerkUserResource,
} from "./types";

/**
 * Safely extract email from Clerk user
 */
function getEmailFromClerkUser(user: ClerkUser | UserResource): string {
  if ("emailAddresses" in user && Array.isArray(user.emailAddresses)) {
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    );
    return (
      primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || ""
    );
  }

  if ("emailAddress" in user && typeof user.emailAddress === "string") {
    return user.emailAddress;
  }

  return "";
}

/**
 * Safely extract role from Clerk user metadata
 */
function getRoleFromMetadata(metadata: any): UserRole | null {
  if (!metadata || typeof metadata !== "object") return null;

  const role = metadata.role;
  if (typeof role === "string") {
    try {
      return UserRoleSchema.parse(role);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Get permissions for a role
 */
function getPermissionsForRole(role: UserRole | null): Permission[] {
  if (!role) return [];
  return rolePermissions[role] || [];
}

/**
 * Convert Clerk User to SafeUser (server-side)
 */
export function adaptClerkUser(user: ClerkUser | null): SafeUser | null {
  if (!user || !isClerkUser(user)) return null;

  try {
    const email = getEmailFromClerkUser(user);
    const role = getRoleFromMetadata(user.publicMetadata);
    const permissions = getPermissionsForRole(role);

    const safeUser: SafeUser = {
      id: user.id,
      emailAddress: email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      imageUrl: user.imageUrl || null,
      role,
      permissions,
      metadata: {
        role,
        onboardingComplete: user.publicMetadata?.onboardingComplete as boolean,
        merchantName: user.publicMetadata?.merchantName as string,
      },
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      isActive: true,
    };

    // Validate the adapted user
    return SafeUserSchema.parse(safeUser);
  } catch (error) {
    console.error("Error adapting Clerk user:", error);
    return null;
  }
}

/**
 * Convert Clerk UserResource to SafeUser (client-side)
 */
export function adaptClerkUserResource(
  user: UserResource | null
): SafeUser | null {
  if (!user || !isClerkUserResource(user)) return null;

  try {
    const email = getEmailFromClerkUser(user);
    const role = getRoleFromMetadata(user.publicMetadata);
    const permissions = getPermissionsForRole(role);

    const safeUser: SafeUser = {
      id: user.id,
      emailAddress: email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      imageUrl: user.imageUrl || null,
      role,
      permissions,
      metadata: {
        role,
        onboardingComplete: user.publicMetadata?.onboardingComplete as boolean,
        merchantName: user.publicMetadata?.merchantName as string,
      },
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      isActive: true,
    };

    // Validate the adapted user
    return SafeUserSchema.parse(safeUser);
  } catch (error) {
    console.error("Error adapting Clerk user resource:", error);
    return null;
  }
}

/**
 * Safely get user display name
 */
export function getUserDisplayName(user: SafeUser | null): string {
  if (!user) return "Unknown User";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.firstName) return user.firstName;
  if (user.lastName) return user.lastName;

  return user.emailAddress || "Unknown User";
}

/**
 * Safely get user initials
 */
export function getUserInitials(user: SafeUser | null): string {
  if (!user) return "?";

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  if (firstName) return firstName[0].toUpperCase();
  if (lastName) return lastName[0].toUpperCase();

  const email = user.emailAddress || "";
  return email[0]?.toUpperCase() || "?";
}

/**
 * Check if user has specific role
 */
export function hasRole(user: SafeUser | null, role: UserRole): boolean {
  if (!user || !user.role) return false;

  // Admin has access to all roles
  if (user.role === "admin") return true;

  return user.role === role;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  user: SafeUser | null,
  permission: Permission
): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: SafeUser | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.some((permission) =>
    user.permissions.includes(permission)
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: SafeUser | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.every((permission) =>
    user.permissions.includes(permission)
  );
}

/**
 * Get user role hierarchy level (for comparison)
 */
export function getRoleLevel(role: UserRole | null): number {
  switch (role) {
    case "admin":
      return 3;
    case "merchant":
      return 2;
    case "viewer":
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if user has higher or equal role level
 */
export function hasRoleLevel(
  user: SafeUser | null,
  minRole: UserRole
): boolean {
  if (!user) return false;
  return getRoleLevel(user.role) >= getRoleLevel(minRole);
}

/**
 * Validate user data integrity
 */
export function validateUserIntegrity(user: SafeUser): boolean {
  try {
    // Check if role matches permissions
    const expectedPermissions = getPermissionsForRole(user.role);
    const hasCorrectPermissions = expectedPermissions.every((permission) =>
      user.permissions.includes(permission)
    );

    // Check metadata consistency
    const metadataRoleMatches = user.metadata.role === user.role;

    return hasCorrectPermissions && metadataRoleMatches;
  } catch {
    return false;
  }
}

/**
 * Sanitize user data for client-side use
 */
export function sanitizeUserForClient(user: SafeUser): Omit<
  SafeUser,
  "metadata"
> & {
  metadata: Pick<UserMetadata, "role" | "merchantName">;
} {
  return {
    ...user,
    metadata: {
      role: user.metadata.role,
      merchantName: user.metadata.merchantName,
    },
  };
}
