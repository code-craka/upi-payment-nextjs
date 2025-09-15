"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  useAuthGuard,
  useRoleGuard,
  usePermissionGuard,
} from "@/lib/auth/safe-client";
import type { Permission, UserRole } from "@/lib/auth/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const router = useRouter();

  // Use auth guard for basic authentication
  const { isAuthenticated, isLoading: authLoading, user } = useAuthGuard();

  // Use role guard if specific role is required
  const { hasAccess: hasRoleAccess, isLoading: roleLoading } = useRoleGuard(
    requiredRole || "viewer"
  );

  // Use permission guard if specific permission is required
  const { hasAccess: hasPermissionAccess, isLoading: permissionLoading } =
    usePermissionGuard(requiredPermission || "view_assigned_orders");

  const isLoading =
    authLoading ||
    (requiredRole ? roleLoading : false) ||
    (requiredPermission ? permissionLoading : false);

  useEffect(() => {
    if (isLoading) return;

    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    // Check role requirement
    if (requiredRole && user) {
      // Admin has access to everything
      if (user.role === "admin") {
        return;
      }

      if (!hasRoleAccess) {
        router.push(redirectTo);
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission && !hasPermissionAccess) {
      router.push(redirectTo);
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    requiredPermission,
    hasRoleAccess,
    hasPermissionAccess,
    router,
    redirectTo,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Check role requirement
  if (requiredRole && user) {
    // Admin has access to everything
    if (user.role === "admin") {
      return <>{children}</>;
    }

    if (!hasRoleAccess) {
      return fallback || null;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermissionAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}
