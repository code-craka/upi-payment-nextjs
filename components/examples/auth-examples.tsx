"use client";

import React from "react";
import {
  useSafeUser,
  useAuthContext,
  useHasRole,
  useHasPermission,
  useIsAdmin,
  useIsMerchant,
  useUserDisplay,
} from "@/lib/auth/safe-client";
import {
  RoleGuard,
  PermissionGuard,
  AdminGuard,
  AuthGuard,
} from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Alert } from "@/components/ui/alert";

/**
 * Example component demonstrating type-safe authentication usage
 */
export function AuthExamples() {
  const { user, isAuthenticated, role, permissions } = useAuthContext();
  const { displayName, initials, email } = useUserDisplay();
  const isAdmin = useIsAdmin();
  const isMerchant = useIsMerchant();
  const canCreateOrders = useHasPermission("create_order");
  const canViewAnalytics = useHasPermission("view_analytics");

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Type-Safe Authentication Examples</h1>

      {/* User Information Display */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">User Information</h2>
        {isAuthenticated ? (
          <div className="space-y-2">
            <p>
              <strong>Display Name:</strong> {displayName}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Initials:</strong> {initials}
            </p>
            <p>
              <strong>Role:</strong> {role || "No role assigned"}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {permissions.map((permission) => (
                <Badge key={permission} variant="outline">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p>Not authenticated</p>
        )}
      </Card>

      {/* Role-based Conditional Rendering */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">
          Role-based Conditional Rendering
        </h2>
        <div className="space-y-2">
          {isAdmin && (
            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
              <strong className="text-green-800">Admin Access:</strong> You have
              full administrative privileges.
            </div>
          )}

          {isMerchant && (
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
              <strong className="text-blue-800">Merchant Access:</strong> You
              can create and manage orders.
            </div>
          )}

          {canCreateOrders && <Button>Create New Order</Button>}

          {canViewAnalytics && (
            <Button variant="outline">View Analytics</Button>
          )}
        </div>
      </Card>

      {/* Role Guards */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Role Guards</h2>

        <div className="space-y-4">
          <AdminGuard>
            <div className="p-4 border border-red-200 bg-red-50 rounded-md">
              <strong className="text-red-800">Admin Only:</strong> This content
              is only visible to administrators.
            </div>
          </AdminGuard>

          <RoleGuard role="merchant">
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
              <strong className="text-blue-800">Merchant Only:</strong> This
              content is only visible to merchants and admins.
            </div>
          </RoleGuard>

          <PermissionGuard permission="view_analytics">
            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
              <strong className="text-green-800">Analytics Permission:</strong>{" "}
              You have permission to view analytics.
            </div>
          </PermissionGuard>
        </div>
      </Card>

      {/* Permission Guards with Fallbacks */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Guards with Fallbacks</h2>

        <div className="space-y-4">
          <AdminGuard
            fallback={
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <strong className="text-red-800">Access Denied:</strong> Admin
                role required to view this content.
              </div>
            }
          >
            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
              <strong className="text-green-800">Admin Content:</strong> Secret
              admin information here!
            </div>
          </AdminGuard>

          <PermissionGuard
            permission="manage_users"
            fallback={
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <strong className="text-red-800">Permission Required:</strong>{" "}
                You need user management permissions.
              </div>
            }
          >
            <div className="p-4 border border-green-200 bg-green-50 rounded-md">
              <strong className="text-green-800">User Management:</strong> You
              can manage users.
            </div>
          </PermissionGuard>
        </div>
      </Card>

      {/* Authentication Guard */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Authentication Guard</h2>

        <AuthGuard
          fallback={
            <div className="p-4 border border-red-200 bg-red-50 rounded-md">
              <strong className="text-red-800">Sign In Required:</strong> Please
              sign in to view this content.
              <Button className="ml-2" size="sm">
                Sign In
              </Button>
            </div>
          }
        >
          <div className="p-4 border border-green-200 bg-green-50 rounded-md">
            <strong className="text-green-800">Authenticated Content:</strong>{" "}
            This is only visible to signed-in users.
          </div>
        </AuthGuard>
      </Card>

      {/* Hook Usage Examples */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Hook Usage Examples</h2>

        <div className="space-y-2 text-sm">
          <p>
            <code>useIsAdmin():</code> {isAdmin.toString()}
          </p>
          <p>
            <code>useIsMerchant():</code> {isMerchant.toString()}
          </p>
          <p>
            <code>useHasRole("admin"):</code> {useHasRole("admin").toString()}
          </p>
          <p>
            <code>useHasPermission("create_order"):</code>{" "}
            {canCreateOrders.toString()}
          </p>
          <p>
            <code>useHasPermission("view_analytics"):</code>{" "}
            {canViewAnalytics.toString()}
          </p>
        </div>
      </Card>

      {/* Error Handling Example */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Error Handling</h2>
        <ErrorBoundaryExample />
      </Card>
    </div>
  );
}

/**
 * Example component showing error handling
 */
function ErrorBoundaryExample() {
  const { user, error } = useSafeUser();

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <strong className="text-red-800">Authentication Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-200 bg-green-50 rounded-md">
      <strong className="text-green-800">No Errors:</strong> Authentication
      system is working correctly.
      {user && (
        <span className="block mt-1">
          User loaded successfully: {user.emailAddress}
        </span>
      )}
    </div>
  );
}

/**
 * Example of a protected component that requires specific permissions
 */
export function ProtectedOrderManagement() {
  return (
    <PermissionGuard
      permission="create_order"
      fallback={
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <span className="text-red-800">
            You don't have permission to manage orders.
          </span>
        </div>
      }
    >
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Order Management</h3>
        <div className="space-y-2">
          <Button>Create New Order</Button>
          <Button variant="outline">View Order History</Button>

          <AdminGuard>
            <Button variant="destructive">Admin: Delete Orders</Button>
          </AdminGuard>
        </div>
      </Card>
    </PermissionGuard>
  );
}

/**
 * Example of a component that adapts based on user role
 */
export function AdaptiveNavigation() {
  const isAdmin = useIsAdmin();
  const isMerchant = useIsMerchant();
  const canViewAnalytics = useHasPermission("view_analytics");

  return (
    <nav className="flex space-x-4">
      <Button variant="ghost">Dashboard</Button>

      {isMerchant && <Button variant="ghost">Orders</Button>}

      {canViewAnalytics && <Button variant="ghost">Analytics</Button>}

      {isAdmin && (
        <>
          <Button variant="ghost">User Management</Button>
          <Button variant="ghost">System Settings</Button>
        </>
      )}
    </nav>
  );
}
