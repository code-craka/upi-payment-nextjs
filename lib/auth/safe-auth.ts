import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import {
  SafeUser,
  UserRole,
  Permission,
  AuthResult,
  AuthError,
  PermissionError,
  RoleError,
} from "./types";
import {
  adaptClerkUser,
  hasRole,
  hasPermission,
  hasRoleLevel,
  validateUserIntegrity,
} from "./adapters";

/**
 * Safely get current authenticated user
 */
export async function getSafeUser(): Promise<SafeUser | null> {
  try {
    const user = await currentUser();
    return adaptClerkUser(user);
  } catch (error) {
    console.error("Error getting safe user:", error);
    return null;
  }
}

/**
 * Safely get current auth info
 */
export async function getSafeAuth(): Promise<{
  userId: string | null;
  sessionId: string | null;
  user: SafeUser | null;
}> {
  try {
    const { userId, sessionId } = await auth();
    const user = userId ? await getSafeUser() : null;

    return { userId, sessionId, user };
  } catch (error) {
    console.error("Error getting safe auth:", error);
    return { userId: null, sessionId: null, user: null };
  }
}

/**
 * Require authentication or throw error
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getSafeUser();

  if (!user) {
    throw new AuthError("Authentication required", "UNAUTHENTICATED", 401);
  }

  // Validate user integrity
  if (!validateUserIntegrity(user)) {
    throw new AuthError("Invalid user data", "INVALID_USER_DATA", 401);
  }

  return user;
}

/**
 * Require authentication or redirect
 */
export async function requireAuthOrRedirect(
  redirectTo: string = "/sign-in"
): Promise<SafeUser> {
  try {
    return await requireAuth();
  } catch (error) {
    redirect(redirectTo);
  }
}

/**
 * Require specific role or throw error
 */
export async function requireRole(role: UserRole): Promise<SafeUser> {
  const user = await requireAuth();

  if (!hasRole(user, role)) {
    throw new RoleError(role, user.role);
  }

  return user;
}

/**
 * Require specific role or redirect
 */
export async function requireRoleOrRedirect(
  role: UserRole,
  redirectTo: string = "/"
): Promise<SafeUser> {
  try {
    return await requireRole(role);
  } catch (error) {
    redirect(redirectTo);
  }
}

/**
 * Require admin role or throw error
 */
export async function requireAdmin(): Promise<SafeUser> {
  return await requireRole("admin");
}

/**
 * Require admin role or redirect
 */
export async function requireAdminOrRedirect(
  redirectTo: string = "/"
): Promise<SafeUser> {
  return await requireRoleOrRedirect("admin", redirectTo);
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(
  permission: Permission
): Promise<SafeUser> {
  const user = await requireAuth();

  if (!hasPermission(user, permission)) {
    throw new PermissionError(permission, user.role);
  }

  return user;
}

/**
 * Require specific permission or redirect
 */
export async function requirePermissionOrRedirect(
  permission: Permission,
  redirectTo: string = "/"
): Promise<SafeUser> {
  try {
    return await requirePermission(permission);
  } catch (error) {
    redirect(redirectTo);
  }
}

/**
 * Check if current user has permission
 */
export async function currentUserHasPermission(
  permission: Permission
): Promise<boolean> {
  try {
    const user = await getSafeUser();
    return hasPermission(user, permission);
  } catch {
    return false;
  }
}

/**
 * Check if current user has role
 */
export async function currentUserHasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getSafeUser();
    return hasRole(user, role);
  } catch {
    return false;
  }
}

/**
 * Get user by ID safely
 */
export async function getSafeUserById(
  userId: string
): Promise<SafeUser | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return adaptClerkUser(user);
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

/**
 * Authenticate request and return safe user
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        user: null,
        error: "Authentication required",
        code: "UNAUTHENTICATED",
      };
    }

    const user = await getSafeUserById(userId);

    if (!user) {
      return {
        success: false,
        user: null,
        error: "User not found",
        code: "USER_NOT_FOUND",
      };
    }

    if (!validateUserIntegrity(user)) {
      return {
        success: false,
        user: null,
        error: "Invalid user data",
        code: "INVALID_USER_DATA",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      user: null,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    };
  }
}

/**
 * Middleware wrapper for authentication
 */
export async function withAuth(
  req: NextRequest,
  handler: (user: SafeUser) => Promise<Response>
): Promise<Response> {
  const authResult = await authenticateRequest(req);

  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      {
        error: authResult.error,
        code: authResult.code,
      },
      { status: 401 }
    );
  }

  return handler(authResult.user);
}

/**
 * Middleware wrapper for role-based authentication
 */
export async function withRole(
  req: NextRequest,
  role: UserRole,
  handler: (user: SafeUser) => Promise<Response>
): Promise<Response> {
  return withAuth(req, async (user) => {
    if (!hasRole(user, role)) {
      return NextResponse.json(
        {
          error: `Access denied. Required role: ${role}`,
          code: "ROLE_REQUIRED",
          userRole: user.role,
        },
        { status: 403 }
      );
    }

    return handler(user);
  });
}

/**
 * Middleware wrapper for permission-based authentication
 */
export async function withPermission(
  req: NextRequest,
  permission: Permission,
  handler: (user: SafeUser) => Promise<Response>
): Promise<Response> {
  return withAuth(req, async (user) => {
    if (!hasPermission(user, permission)) {
      return NextResponse.json(
        {
          error: `Access denied. Required permission: ${permission}`,
          code: "PERMISSION_DENIED",
          userRole: user.role,
          userPermissions: user.permissions,
        },
        { status: 403 }
      );
    }

    return handler(user);
  });
}

/**
 * Middleware wrapper for admin authentication
 */
export async function withAdmin(
  req: NextRequest,
  handler: (user: SafeUser) => Promise<Response>
): Promise<Response> {
  return withRole(req, "admin", handler);
}

/**
 * Get authentication context for components
 */
export async function getAuthContext(): Promise<{
  user: SafeUser | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  permissions: Permission[];
}> {
  const user = await getSafeUser();

  return {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    permissions: user?.permissions || [],
  };
}
