"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useState, useEffect, useMemo } from "react";
import { SafeUser, UserRole, Permission, AuthContext } from "./types";
import {
  adaptClerkUserResource,
  hasRole,
  hasPermission,
  hasRoleLevel,
  getUserDisplayName,
  getUserInitials,
  sanitizeUserForClient,
} from "./adapters";

/**
 * Hook to get safe user data (client-side)
 */
export function useSafeUser(): {
  user: SafeUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  error: string | null;
} {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => {
    if (!clerkUser) return null;

    try {
      const safeUser = adaptClerkUserResource(clerkUser);
      setError(null);
      return safeUser;
    } catch (err) {
      console.error("Error adapting user:", err);
      setError("Failed to load user data");
      return null;
    }
  }, [clerkUser]);

  return { user, isLoaded, isSignedIn, error };
}

/**
 * Hook to get authentication context
 */
export function useAuthContext(): AuthContext {
  const { user, isLoaded, isSignedIn } = useSafeUser();

  return {
    user,
    isAuthenticated: isSignedIn && !!user,
    isLoading: !isLoaded,
    role: user?.role || null,
    permissions: user?.permissions || [],
  };
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: UserRole): boolean {
  const { user } = useSafeUser();
  return hasRole(user, role);
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useSafeUser();
  return hasPermission(user, permission);
}

/**
 * Hook to check if user has admin role
 */
export function useIsAdmin(): boolean {
  return useHasRole("admin");
}

/**
 * Hook to check if user has merchant role or higher
 */
export function useIsMerchant(): boolean {
  const { user } = useSafeUser();
  return hasRoleLevel(user, "merchant");
}

/**
 * Hook to check if user has viewer role or higher
 */
export function useIsViewer(): boolean {
  const { user } = useSafeUser();
  return hasRoleLevel(user, "viewer");
}

/**
 * Hook to get user display information
 */
export function useUserDisplay(): {
  displayName: string;
  initials: string;
  email: string;
  imageUrl: string | null;
} {
  const { user } = useSafeUser();

  return {
    displayName: getUserDisplayName(user),
    initials: getUserInitials(user),
    email: user?.emailAddress || "",
    imageUrl: user?.imageUrl || null,
  };
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleGuard(requiredRole: UserRole): {
  hasAccess: boolean;
  isLoading: boolean;
  user: SafeUser | null;
} {
  const { user, isLoaded } = useSafeUser();
  const hasAccess = hasRole(user, requiredRole);

  return {
    hasAccess,
    isLoading: !isLoaded,
    user,
  };
}

/**
 * Hook for permission-based conditional rendering
 */
export function usePermissionGuard(requiredPermission: Permission): {
  hasAccess: boolean;
  isLoading: boolean;
  user: SafeUser | null;
} {
  const { user, isLoaded } = useSafeUser();
  const hasAccess = hasPermission(user, requiredPermission);

  return {
    hasAccess,
    isLoading: !isLoaded,
    user,
  };
}

/**
 * Hook for authentication guard
 */
export function useAuthGuard(): {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SafeUser | null;
  error: string | null;
} {
  const { user, isLoaded, isSignedIn, error } = useSafeUser();

  return {
    isAuthenticated: isSignedIn && !!user,
    isLoading: !isLoaded,
    user,
    error,
  };
}

/**
 * Hook to get sanitized user data for API calls
 */
export function useSanitizedUser() {
  const { user } = useSafeUser();

  return useMemo(() => {
    if (!user) return null;
    return sanitizeUserForClient(user);
  }, [user]);
}

/**
 * Hook for session management
 */
export function useSession(): {
  isActive: boolean;
  lastActivity: Date | null;
  refresh: () => Promise<void>;
  invalidate: () => Promise<void>;
} {
  const { getToken } = useAuth();
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(false);

  const refresh = async () => {
    try {
      const token = await getToken();
      if (token) {
        setLastActivity(new Date());
        setIsActive(true);

        // Call session refresh endpoint
        await fetch("/api/auth/refresh-session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Session refresh error:", error);
      setIsActive(false);
    }
  };

  const invalidate = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setIsActive(false);
      setLastActivity(null);
    } catch (error) {
      console.error("Session invalidation error:", error);
    }
  };

  // Auto-refresh session activity
  useEffect(() => {
    const interval = setInterval(refresh, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return {
    isActive,
    lastActivity,
    refresh,
    invalidate,
  };
}

/**
 * Hook for user preferences and settings
 */
export function useUserPreferences(): {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  updatePreferences: (
    prefs: Partial<{
      theme: "light" | "dark" | "system";
      language: string;
      timezone: string;
    }>
  ) => Promise<void>;
} {
  const { user } = useSafeUser();
  const [preferences, setPreferences] = useState({
    theme: "system" as const,
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const updatePreferences = async (prefs: Partial<typeof preferences>) => {
    try {
      // Update local state
      setPreferences((prev) => ({ ...prev, ...prefs }));

      // Persist to localStorage
      localStorage.setItem(
        "userPreferences",
        JSON.stringify({ ...preferences, ...prefs })
      );

      // Optionally sync with server
      if (user) {
        await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
        });
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  // Load preferences on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("userPreferences");
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  }, []);

  return {
    ...preferences,
    updatePreferences,
  };
}
