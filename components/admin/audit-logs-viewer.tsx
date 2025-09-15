"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
  };
}

const ACTION_COLORS = {
  order_created: "bg-blue-100 text-blue-800",
  order_status_updated: "bg-yellow-100 text-yellow-800",
  utr_submitted: "bg-green-100 text-green-800",
  user_created: "bg-purple-100 text-purple-800",
  user_deleted: "bg-red-100 text-red-800",
  user_role_updated: "bg-orange-100 text-orange-800",
  settings_updated: "bg-indigo-100 text-indigo-800",
  login_attempt: "bg-gray-100 text-gray-800",
  logout: "bg-gray-100 text-gray-800",
};

const ENTITY_TYPE_COLORS = {
  order: "bg-blue-50 text-blue-700",
  user: "bg-green-50 text-green-700",
  settings: "bg-purple-50 text-purple-700",
  auth: "bg-gray-50 text-gray-700",
};

export function AuditLogsViewer() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<
    AuditLogsResponse["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    userId: "",
    action: "",
    entityType: "",
    entityId: "",
    startDate: "",
    endDate: "",
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data: AuditLogsResponse = await response.json();
      setAuditLogs(data.auditLogs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = () => {
    fetchAuditLogs();
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatEntityType = (entityType: string) => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const renderLogDetails = (log: AuditLog) => {
    if (!log.details || Object.keys(log.details).length === 0) {
      return <div className="text-sm text-gray-500">No additional details</div>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(log.details).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-gray-700">{key}:</span>{" "}
            <span className="text-gray-600">
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <Input
                placeholder="Filter by user ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
              >
                <option value="">All Actions</option>
                <option value="order_created">Order Created</option>
                <option value="order_status_updated">
                  Order Status Updated
                </option>
                <option value="utr_submitted">UTR Submitted</option>
                <option value="user_created">User Created</option>
                <option value="user_deleted">User Deleted</option>
                <option value="user_role_updated">User Role Updated</option>
                <option value="settings_updated">Settings Updated</option>
                <option value="login_attempt">Login Attempt</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Entity Type
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.entityType}
                onChange={(e) =>
                  handleFilterChange("entityType", e.target.value)
                }
              >
                <option value="">All Types</option>
                <option value="order">Order</option>
                <option value="user">User</option>
                <option value="settings">Settings</option>
                <option value="auth">Authentication</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Entity ID
              </label>
              <Input
                placeholder="Filter by entity ID"
                value={filters.entityId}
                onChange={(e) => handleFilterChange("entityId", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search Logs"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          Error loading audit logs: {error}
        </div>
      )}

      {/* Audit Logs List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b last:border-b-0">
                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleLogExpansion(log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge
                        className={
                          ACTION_COLORS[
                            log.action as keyof typeof ACTION_COLORS
                          ] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {formatActionName(log.action)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          ENTITY_TYPE_COLORS[
                            log.entityType as keyof typeof ENTITY_TYPE_COLORS
                          ] || ""
                        }
                      >
                        {formatEntityType(log.entityType)}
                      </Badge>

                      {log.entityId && (
                        <span className="text-sm text-gray-600 font-mono">
                          {log.entityId}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">{log.userName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">User:</span> {log.userEmail}{" "}
                      ({log.userRole})
                      {log.ipAddress && (
                        <>
                          {" • "}
                          <span className="font-medium">IP:</span>{" "}
                          {log.ipAddress}
                        </>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      {expandedLog === log.id ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>
                </div>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t">
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2">Details:</h4>
                      {renderLogDetails(log)}

                      {log.userAgent && (
                        <div className="mt-3 text-xs text-gray-500">
                          <span className="font-medium">User Agent:</span>{" "}
                          {log.userAgent}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} logs
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
