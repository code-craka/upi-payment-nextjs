# Type-Safe Authentication System

This directory contains a comprehensive type-safe authentication layer built on top of Clerk, providing unified user management, role-based access control, and consistent error handling throughout the application.

## Overview

The type-safe authentication system provides:

- **Unified User Types**: Consistent `SafeUser` type across client and server
- **Role-Based Access Control**: Admin, Merchant, and Viewer roles with granular permissions
- **Type Guards**: Runtime validation with Zod schemas
- **Error Handling**: Comprehensive error types and handling
- **Client/Server Adapters**: Seamless integration between Clerk and application types
- **React Hooks**: Type-safe hooks for client-side authentication
- **Middleware**: Server-side authentication and authorization middleware

## File Structure

```
lib/auth/
├── types.ts              # Core types, schemas, and interfaces
├── adapters.ts           # Clerk user adaptation and utility functions
├── safe-auth.ts          # Server-side type-safe authentication
├── safe-client.ts        # Client-side type-safe hooks
├── permissions.ts        # Legacy compatibility layer
├── permissions-client.ts # Client-side permissions (legacy)
├── client.ts             # Client hooks (legacy)
├── server.ts             # Server functions (legacy)
├── utils.ts              # Authentication utilities (legacy)
└── clerk-config.ts       # Clerk configuration
```

## Core Types

### SafeUser

The `SafeUser` type is the foundation of the type-safe system:

```typescript
interface SafeUser {
  id: string;
  emailAddress: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: UserRole | null;
  permissions: Permission[];
  metadata: UserMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### Roles and Permissions

```typescript
type UserRole = "admin" | "merchant" | "viewer";

type Permission =
  | "create_user"
  | "delete_user"
  | "view_all_orders"
  | "update_settings"
  | "manage_users"
  | "verify_orders"
  | "view_analytics"
  | "create_order"
  | "view_own_orders"
  | "manage_own_links"
  | "view_assigned_orders";
```

## Server-Side Usage

### Basic Authentication

```typescript
import { getSafeUser, requireAuth } from "@/lib/auth/safe-auth";

// Get current user (returns null if not authenticated)
const user = await getSafeUser();

// Require authentication (throws error if not authenticated)
const user = await requireAuth();
```

### Role-Based Access

```typescript
import {
  requireRole,
  requireAdmin,
  requirePermission,
} from "@/lib/auth/safe-auth";

// Require specific role
const user = await requireRole("admin");

// Require admin role (shorthand)
const user = await requireAdmin();

// Require specific permission
const user = await requirePermission("create_order");
```

### API Route Middleware

```typescript
import {
  withStandardMiddleware,
  withAdminMiddleware,
} from "@/lib/middleware/auth-middleware";

// Standard authenticated route
export const POST = withStandardMiddleware(async (request: NextRequest) => {
  const user = getUserFromRequest(request);
  // Handle authenticated request
});

// Admin-only route
export const DELETE = withAdminMiddleware(async (request: NextRequest) => {
  const user = getUserFromRequest(request);
  // Handle admin request
});
```

## Client-Side Usage

### React Hooks

```typescript
import {
  useSafeUser,
  useAuthContext,
  useHasRole,
  useHasPermission,
  useIsAdmin,
} from "@/lib/auth/safe-client";

function MyComponent() {
  const { user, isLoaded, error } = useSafeUser();
  const { isAuthenticated, role, permissions } = useAuthContext();
  const isAdmin = useIsAdmin();
  const canCreateOrders = useHasPermission("create_order");

  if (!isLoaded) return <Loading />;
  if (error) return <Error message={error} />;
  if (!isAuthenticated) return <SignIn />;

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      {isAdmin && <AdminPanel />}
      {canCreateOrders && <CreateOrderButton />}
    </div>
  );
}
```

### Role Guards

```typescript
import { RoleGuard, PermissionGuard, AdminGuard } from "@/components/auth/role-guard";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <AdminGuard>
        <AdminPanel />
      </AdminGuard>

      <RoleGuard role="merchant">
        <MerchantTools />
      </RoleGuard>

      <PermissionGuard permission="view_analytics">
        <AnalyticsWidget />
      </PermissionGuard>
    </div>
  );
}
```

## Error Handling

The system provides comprehensive error handling:

```typescript
import { AuthError, PermissionError, RoleError } from "@/lib/auth/types";

try {
  const user = await requireAdmin();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle authentication error
  } else if (error instanceof PermissionError) {
    // Handle permission error
  } else if (error instanceof RoleError) {
    // Handle role error
  }
}
```

## Migration from Legacy System

### Server-Side Migration

**Before:**

```typescript
import { getCurrentUser, getUserRole } from "@/lib/auth/server";

const user = await getCurrentUser();
const role = getUserRole(user);
```

**After:**

```typescript
import { getSafeUser } from "@/lib/auth/safe-auth";

const user = await getSafeUser();
const role = user?.role;
```

### Client-Side Migration

**Before:**

```typescript
import { useUserRole, useIsAdmin } from "@/lib/auth/client";

const role = useUserRole();
const isAdmin = useIsAdmin();
```

**After:**

```typescript
import { useAuthContext, useIsAdmin } from "@/lib/auth/safe-client";

const { role } = useAuthContext();
const isAdmin = useIsAdmin();
```

## Best Practices

### 1. Use Type-Safe Functions

Always use the new type-safe functions instead of legacy ones:

```typescript
// ✅ Good
import { getSafeUser } from "@/lib/auth/safe-auth";
const user = await getSafeUser();

// ❌ Avoid
import { getCurrentUser } from "@/lib/auth/server";
const user = await getCurrentUser();
```

### 2. Handle Loading States

Always handle loading and error states in client components:

```typescript
function MyComponent() {
  const { user, isLoaded, error } = useSafeUser();

  if (!isLoaded) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <SignInPrompt />;

  return <ActualContent user={user} />;
}
```

### 3. Use Guards for Conditional Rendering

Use role guards instead of manual role checks:

```typescript
// ✅ Good
<AdminGuard>
  <AdminPanel />
</AdminGuard>

// ❌ Avoid
{isAdmin && <AdminPanel />}
```

### 4. Validate User Integrity

The system automatically validates user data integrity, but you can also check manually:

```typescript
import { validateUserIntegrity } from "@/lib/auth/adapters";

const user = await getSafeUser();
if (user && !validateUserIntegrity(user)) {
  // Handle corrupted user data
}
```

## Testing

### Unit Tests

```typescript
import { adaptClerkUser, hasRole, hasPermission } from "@/lib/auth/adapters";

describe("Auth Adapters", () => {
  it("should adapt Clerk user correctly", () => {
    const clerkUser = createMockClerkUser();
    const safeUser = adaptClerkUser(clerkUser);

    expect(safeUser).toBeDefined();
    expect(safeUser?.role).toBe("admin");
  });

  it("should check roles correctly", () => {
    const user = createMockSafeUser({ role: "admin" });

    expect(hasRole(user, "admin")).toBe(true);
    expect(hasRole(user, "merchant")).toBe(true); // Admin has all access
  });
});
```

### Integration Tests

```typescript
import { withAuth } from "@/lib/auth/safe-auth";

describe("API Authentication", () => {
  it("should authenticate valid requests", async () => {
    const request = createMockRequest();
    const response = await withAuth(request, async (user) => {
      expect(user).toBeDefined();
      return new Response("OK");
    });

    expect(response.status).toBe(200);
  });
});
```

## Security Considerations

1. **User Data Validation**: All user data is validated using Zod schemas
2. **Role Integrity**: User roles and permissions are validated on every request
3. **Error Handling**: Sensitive information is never exposed in error messages
4. **Session Management**: Comprehensive session tracking and validation
5. **Rate Limiting**: Built-in rate limiting for authentication endpoints

## Performance Optimizations

1. **Caching**: User data is cached to reduce Clerk API calls
2. **Lazy Loading**: Permissions are computed on-demand
3. **Memoization**: React hooks use proper memoization
4. **Batch Operations**: Multiple permission checks are batched when possible

## Troubleshooting

### Common Issues

1. **User not found**: Check if Clerk user exists and has proper metadata
2. **Permission denied**: Verify user role and permissions in Clerk dashboard
3. **Type errors**: Ensure you're using the new type-safe functions
4. **Loading states**: Always handle loading states in client components

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG_AUTH=true
```

This will log detailed authentication information to the console.

## Contributing

When adding new authentication features:

1. Update the `SafeUser` type if needed
2. Add corresponding Zod schemas for validation
3. Update both client and server adapters
4. Add comprehensive tests
5. Update this documentation

## Legacy Compatibility

The system maintains backward compatibility with the existing authentication code. Legacy functions are marked as deprecated and will be removed in a future version. Please migrate to the new type-safe system as soon as possible.
