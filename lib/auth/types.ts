import { z } from "zod";
import type { User as ClerkUser } from "@clerk/nextjs/server";
import type { UserResource } from "@clerk/types";

// Zod schemas for validation
export const UserRoleSchema = z.enum(["admin", "merchant", "viewer"]);
export const PermissionSchema = z.enum([
  "create_user",
  "delete_user",
  "view_all_orders",
  "update_settings",
  "manage_users",
  "verify_orders",
  "view_analytics",
  "create_order",
  "view_own_orders",
  "manage_own_links",
  "view_assigned_orders",
]);

export const UserMetadataSchema = z.object({
  role: UserRoleSchema.optional(),
  onboardingComplete: z.boolean().optional(),
  merchantName: z.string().optional(),
  permissions: z.array(PermissionSchema).optional(),
});

export const SafeUserSchema = z.object({
  id: z.string(),
  emailAddress: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  role: UserRoleSchema.nullable(),
  permissions: z.array(PermissionSchema),
  metadata: UserMetadataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
});

// TypeScript types
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type UserMetadata = z.infer<typeof UserMetadataSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;

// Authentication result types
export interface AuthResult {
  success: boolean;
  user: SafeUser | null;
  error?: string;
  code?: string;
}

export interface AuthContext {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  permissions: Permission[];
}

// Permission mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
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
    "manage_own_links",
  ],
  merchant: ["create_order", "view_own_orders", "manage_own_links"],
  viewer: ["view_assigned_orders"],
};

// Type guards
export function isClerkUser(user: unknown): user is ClerkUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "emailAddresses" in user
  );
}

export function isClerkUserResource(user: unknown): user is UserResource {
  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    "emailAddresses" in user &&
    "publicMetadata" in user
  );
}

export function isSafeUser(user: unknown): user is SafeUser {
  try {
    SafeUserSchema.parse(user);
    return true;
  } catch {
    return false;
  }
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = "AUTH_ERROR",
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class PermissionError extends AuthError {
  constructor(permission: Permission, userRole?: UserRole | null) {
    super(
      `Access denied. Required permission: ${permission}${
        userRole ? ` (current role: ${userRole})` : ""
      }`,
      "PERMISSION_DENIED",
      403
    );
  }
}

export class RoleError extends AuthError {
  constructor(requiredRole: UserRole, userRole?: UserRole | null) {
    super(
      `Access denied. Required role: ${requiredRole}${
        userRole ? ` (current role: ${userRole})` : ""
      }`,
      "ROLE_REQUIRED",
      403
    );
  }
}
