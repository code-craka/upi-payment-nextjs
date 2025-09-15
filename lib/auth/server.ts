// Re-export from new type-safe system
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

// Legacy compatibility functions (deprecated - use safe-auth instead)
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { adaptClerkUser } from "./adapters";
import type { Permission, UserRole } from "./types";

/**
 * @deprecated Use getSafeUser() instead
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * @deprecated Use getSafeAuth() instead
 */
export async function getCurrentAuth() {
  return await auth();
}

/**
 * @deprecated Use requireAuthOrRedirect() instead
 */
export async function requireAuthLegacy() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

/**
 * @deprecated Use requireAuthOrRedirect() instead
 */
export async function getAuthenticatedUser() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * @deprecated Use requireRoleOrRedirect() instead
 */
export async function requireRoleLegacy(
  role: UserRole,
  redirectTo: string = "/"
) {
  const user = await currentUser();
  const safeUser = adaptClerkUser(user);
  const userRole = safeUser?.role;

  if (userRole !== role && userRole !== "admin") {
    redirect(redirectTo);
  }

  return user!;
}

/**
 * @deprecated Use requireAdminOrRedirect() instead
 */
export async function requireAdminRole(redirectTo: string = "/") {
  const user = await currentUser();
  const safeUser = adaptClerkUser(user);

  if (safeUser?.role !== "admin") {
    redirect(redirectTo);
  }

  return user!;
}

/**
 * @deprecated Use currentUserHasRole() instead
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  const safeUser = adaptClerkUser(user);
  return safeUser?.role || null;
}
