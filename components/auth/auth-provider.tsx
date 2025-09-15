"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  useSafeUser,
  useAuthContext,
  useSession,
} from "@/lib/auth/safe-client";
import type { SafeUser, AuthContext } from "@/lib/auth/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthProviderContextType extends AuthContext {
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  sessionInfo: {
    isActive: boolean;
    lastActivity: Date | null;
    refresh: () => Promise<void>;
    invalidate: () => Promise<void>;
  };
}

const AuthProviderContext = createContext<AuthProviderContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthProvider({
  children,
  fallback,
  requireAuth = false,
}: AuthProviderProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { user, isAuthenticated, isLoading, role, permissions } =
    useAuthContext();
  const sessionInfo = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a re-fetch of user data
      await sessionInfo.refresh();
      // Force re-render by updating session
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const logout = async () => {
    try {
      await sessionInfo.invalidate();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error during logout:", error);
      // Force redirect even if logout fails
      window.location.href = "/sign-in";
    }
  };

  // Show loading state while authentication is being determined
  if (isLoading || !clerkLoaded || isRefreshing) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to sign-in if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    window.location.href = "/sign-in";
    return null;
  }

  const contextValue: AuthProviderContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || isRefreshing,
    role,
    permissions,
    refreshUser,
    logout,
    sessionInfo,
  };

  return (
    <AuthProviderContext.Provider value={contextValue}>
      {children}
    </AuthProviderContext.Provider>
  );
}

export function useAuth(): AuthProviderContextType {
  const context = useContext(AuthProviderContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Convenience hooks
export function useAuthUser(): SafeUser | null {
  const { user } = useAuth();
  return user;
}

export function useAuthRole() {
  const { role } = useAuth();
  return role;
}

export function useAuthPermissions() {
  const { permissions } = useAuth();
  return permissions;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
