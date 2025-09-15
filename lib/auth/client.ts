"use client";

// Re-export from new type-safe client system
export {
  useSafeUser,
  useAuthContext,
  useHasRole,
  useHasPermission,
  useIsAdmin,
  useIsMerchant,
  useIsViewer,
  useUserDisplay,
  useRoleGuard,
  usePermissionGuard,
  useAuthGuard,
  useSanitizedUser,
  useSession,
  useUserPreferences,
} from "./safe-client";

// Legacy compatibility (deprecated - use safe-client instead)
import { useUser } from "@clerk/nextjs";
import { adaptClerkUserResource } from "./adapters";
import type { Permission, UserRole } from "./types";

/**
 * @deprecated Use useSafeUser() instead
 */
export function useUserRole(): UserRole | null {
  const { user } = useUser();
  const safeUser = adaptClerkUserResource(user);
  return safeUser?.role || null;
}

/**
 * @deprecated Use useHasPermission() from safe-client instead
 */
export function useHasPermissionLegacy(permission: Permission): boolean {
  const { user } = useUser();
  const safeUser = adaptClerkUserResource(user);
  return safeUser?.permissions.includes(permission) || false;
}

/**
 * @deprecated Use useIsAdmin() from safe-client instead
 */
export function useIsAdminLegacy(): boolean {
  const role = useUserRole();
  return role === "admin";
}

/**
 * @deprecated Use useIsMerchant() from safe-client instead
 */
export function useIsMerchantLegacy(): boolean {
  const role = useUserRole();
  return role === "merchant" || role === "admin";
}

/**
 * @deprecated Use useIsViewer() from safe-client instead
 */
export function useIsViewerLegacy(): boolean {
  const role = useUserRole();
  return role === "viewer" || role === "merchant" || role === "admin";
}

/**
 * @deprecated Use useAuthContext() from safe-client instead
 */
export function useAuthStatus() {
  const { user, isLoaded, isSignedIn } = useUser();
  const safeUser = adaptClerkUserResource(user);

  return {
    user: safeUser,
    isLoaded,
    isSignedIn,
    role: safeUser?.role || null,
    isAdmin: safeUser?.role === "admin",
    isMerchant: safeUser?.role === "merchant" || safeUser?.role === "admin",
    isViewer: ["viewer", "merchant", "admin"].includes(safeUser?.role || ""),
  };
}
