"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getUserRole,
  hasPermission,
  type Permission,
  type UserRole,
} from "@/lib/auth/permissions";

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
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const userRole = getUserRole(user);
      if (userRole !== requiredRole && userRole !== "admin") {
        router.push(redirectTo);
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission) {
      if (!hasPermission(user, requiredPermission)) {
        router.push(redirectTo);
        return;
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    requiredRole,
    requiredPermission,
    router,
    redirectTo,
  ]);

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isSignedIn) {
    return fallback || null;
  }

  // Check role requirement
  if (requiredRole) {
    const userRole = getUserRole(user);
    if (userRole !== requiredRole && userRole !== "admin") {
      return fallback || null;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    if (!hasPermission(user, requiredPermission)) {
      return fallback || null;
    }
  }

  return <>{children}</>;
}
