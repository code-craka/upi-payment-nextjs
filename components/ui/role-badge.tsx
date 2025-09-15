"use client";

import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/auth/permissions-client";

interface RoleBadgeProps {
  role: UserRole | null;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const getVariant = (role: UserRole | null) => {
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

  if (!role) return null;

  return (
    <Badge variant={getVariant(role)} className={className}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}
