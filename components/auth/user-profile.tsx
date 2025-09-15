"use client";

import { UserButton } from "@clerk/nextjs";
import { useSafeUser, useUserDisplay } from "@/lib/auth/safe-client";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface UserProfileProps {
  showRole?: boolean;
  showEmail?: boolean;
  className?: string;
}

export function UserProfile({
  showRole = true,
  showEmail = false,
  className = "",
}: UserProfileProps) {
  const { user, isLoaded, error } = useSafeUser();
  const { displayName, email } = useUserDisplay();

  if (!isLoaded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <span className="text-sm">Error loading profile</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "merchant":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex flex-col items-end space-y-1">
        {showEmail && email && (
          <span className="text-sm text-gray-600">{email}</span>
        )}
        {showRole && user.role && (
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        )}
      </div>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </div>
  );
}

export function UserInfo() {
  const { user, isLoaded, error } = useSafeUser();
  const { displayName, email } = useUserDisplay();

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error || !user) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-1">
      <span className="font-medium">{displayName}</span>
      <span className="text-sm text-gray-500">{email}</span>
      {user.role && (
        <Badge variant="outline" className="w-fit text-xs">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      )}
    </div>
  );
}
