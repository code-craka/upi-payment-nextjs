"use client";

import { useUser } from "@clerk/nextjs";
import {
  getUserRole,
  hasPermission,
  type Permission,
  type UserRole,
} from "./permissions-client";

/**
 * Hook to get current user's role (client-side)
 */
export function useUserRole(): UserRole | null {
  const { user } = useUser();
  return getUserRole(user);
}

/**
 * Hook to check if user has specific permission (client-side)
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useUser();
  return hasPermission(user, permission);
}

/**
 * Hook to check if user is admin (client-side)
 */
export function useIsAdmin(): boolean {
  const role = useUserRole();
  return role === "admin";
}

/**
 * Hook to check if user is merchant (client-side)
 */
export function useIsMerchant(): boolean {
  const role = useUserRole();
  return role === "merchant" || role === "admin";
}

/**
 * Hook to check if user is viewer (client-side)
 */
export function useIsViewer(): boolean {
  const role = useUserRole();
  return role === "viewer" || role === "merchant" || role === "admin";
}

/**
 * Hook to get user authentication status and role info
 */
export function useAuthStatus() {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = getUserRole(user);

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
    isAdmin: role === "admin",
    isMerchant: role === "merchant" || role === "admin",
    isViewer: role === "viewer" || role === "merchant" || role === "admin",
  };
}
