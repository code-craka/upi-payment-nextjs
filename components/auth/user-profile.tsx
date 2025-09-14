"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useUserRole } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";

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
  const { user, isLoaded } = useUser();
  const role = useUserRole();

  if (!isLoaded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
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
        {showEmail && user.primaryEmailAddress && (
          <span className="text-sm text-gray-600">
            {user.primaryEmailAddress.emailAddress}
          </span>
        )}
        {showRole && role && (
          <Badge variant={getRoleBadgeVariant(role)} className="text-xs">
            {role.charAt(0).toUpperCase() + role.slice(1)}
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
  const { user, isLoaded } = useUser();
  const role = useUserRole();

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-1">
      <span className="font-medium">
        {user.firstName} {user.lastName}
      </span>
      <span className="text-sm text-gray-500">
        {user.primaryEmailAddress?.emailAddress}
      </span>
      {role && (
        <Badge variant="outline" className="w-fit text-xs">
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      )}
    </div>
  );
}
