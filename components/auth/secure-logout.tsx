"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ClientSessionManager } from "@/lib/utils/session-manager";
import { Loader2 } from "lucide-react";

// Use a different icon name that exists in lucide-react
let LogOutIcon;
try {
  const { LogOut } = require("lucide-react");
  LogOutIcon = LogOut;
} catch {
  // Fallback icon component
  LogOutIcon = () => <span>⏻</span>;
}

interface SecureLogoutProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function SecureLogout({
  variant = "ghost",
  size = "default",
  showIcon = true,
  children,
}: SecureLogoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Perform secure logout
      await ClientSessionManager.logout();

      // Sign out from Clerk
      await signOut();

      // Redirect to sign-in page
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);

      // Force redirect even if logout fails
      window.location.href = "/sign-in";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2"
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOutIcon className="h-4 w-4" />
      )}
      {children || (isLoggingOut ? "Signing out..." : "Sign out")}
    </Button>
  );
}

/**
 * Hook for programmatic secure logout
 */
export function useSecureLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await ClientSessionManager.logout();
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/sign-in";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}
