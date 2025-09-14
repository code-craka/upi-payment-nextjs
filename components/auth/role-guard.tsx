"use client";

import { useUser } from "@clerk/nextjs";
import {
  getUserRole,
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/auth/permissions";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified roles/permissions
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { user, isLoaded, isSignedIn } = useUser();

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn || !user) {
    return <>{fallback}</>;
  }

  const userRole = getUserRole(user);

  // Check role requirements
  let hasRequiredRole = true;
  if (allowedRoles && allowedRoles.length > 0) {
    hasRequiredRole = allowedRoles.includes(userRole!) || userRole === "admin";
  }

  // Check permission requirements
  let hasRequiredPermission = true;
  if (requiredPermission) {
    hasRequiredPermission = hasPermission(user, requiredPermission);
  }

  // Determine if user should see content
  const shouldShowContent = requireAll
    ? hasRequiredRole && hasRequiredPermission
    : hasRequiredRole || hasRequiredPermission;

  if (!shouldShowContent) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function MerchantOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["merchant"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function MerchantOrAdmin({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["merchant", "admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
