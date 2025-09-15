"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "merchant" | "viewer";
  createdAt: number;
  lastSignInAt?: number;
  imageUrl?: string;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "merchant" | "viewer";
}

interface UserManagementProps {
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

export function UserManagement({
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
}: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Form state for creating new user
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: "",
    firstName: "",
    lastName: "",
    role: "viewer",
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (roleFilter) {
        params.append("role", roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreateLoading(true);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      // Reset form
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "viewer",
      });
      setShowCreateForm(false);

      // Refresh users list
      await fetchUsers();
      onUserCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  // Update user role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user role");
      }

      // Refresh users list
      await fetchUsers();
      setEditingUser(null);
      onUserUpdated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role"
      );
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      // Refresh users list
      await fetchUsers();
      onUserDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
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

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            User Management
          </h2>
          <p className="text-sm text-gray-600">
            Create, manage, and assign roles to system users
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full sm:w-auto"
        >
          Create New User
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="role-filter" className="text-sm font-medium">
            Filter by role:
          </Label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="merchant">Merchant</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchUsers()}
          className="w-full sm:w-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: e.target.value as "admin" | "merchant" | "viewer",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="viewer">Viewer</option>
                <option value="merchant">Merchant</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={createLoading}
                className="w-full sm:w-auto"
              >
                {createLoading ? "Creating..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.imageUrl ? (
                            <Image
                              className="h-10 w-10 rounded-full"
                              src={user.imageUrl}
                              alt=""
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleUpdateRole(user.id, e.target.value)
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="merchant">Merchant</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {editingUser === user.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user.id)}
                          >
                            Edit Role
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteUser(
                              user.id,
                              `${user.firstName} ${user.lastName}`
                            )
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
