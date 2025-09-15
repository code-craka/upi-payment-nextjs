"use client";

import React from "react";
import { useRoleGuard, usePermissionGuard } from "@/lib/auth/safe-client";
import type { UserRole, Permission } from "@/lib/auth/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// import { Alert } from "@/components/ui/alert";

interface RoleGuardProps {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function RoleGuard({
  role,
  children,
  fallback,
  showError = true,
}: RoleGuardProps) {
  const { hasAccess, isLoading, user } = useRoleGuard(role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <h4 className="font-semibold text-red-800">Access Denied</h4>
          <p className="text-red-600">
            You need {role} role to access this content.
            {user && (
              <span className="block text-sm mt-1">
                Current role: {user.role || "No role assigned"}
              </span>
            )}
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function PermissionGuard({
  permission,
  children,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const { hasAccess, isLoading, user } = usePermissionGuard(permission);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <h4 className="font-semibold text-red-800">Permission Required</h4>
          <p className="text-red-600">
            You need the "{permission}" permission to access this content.
            {user && (
              <span className="block text-sm mt-1">
                Current role: {user.role || "No role assigned"}
              </span>
            )}
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function AdminGuard({
  children,
  fallback,
  showError = true,
}: AdminGuardProps) {
  return (
    <RoleGuard role="admin" fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  );
}

interface MerchantGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export function MerchantGuard({
  children,
  fallback,
  showError = true,
}: MerchantGuardProps) {
  return (
    <RoleGuard role="merchant" fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  );
}

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  redirectTo = "/sign-in",
  showError = true,
}: AuthGuardProps) {
  const { hasAccess, isLoading } = useRoleGuard("viewer");
  const isAuthenticated = hasAccess;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
          <h4 className="font-semibold text-blue-800">
            Authentication Required
          </h4>
          <p className="text-blue-600">
            Please sign in to access this content.
            <a href={redirectTo} className="ml-2 text-blue-600 hover:underline">
              Sign In
            </a>
          </p>
        </div>
      );
    }

    // Redirect to sign-in page
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }

    return null;
  }

  return <>{children}</>;
}
