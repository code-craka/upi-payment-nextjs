"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

interface Order {
  _id: string;
  orderId: string;
  amount: number;
  merchantName: string;
  vpa: string;
  status:
    | "pending"
    | "pending-verification"
    | "completed"
    | "expired"
    | "failed";
  utr?: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

interface OrdersOverviewProps {
  onOrderUpdated?: () => void;
}

export function OrdersOverview({ onOrderUpdated }: OrdersOverviewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/orders?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  // Update order status
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    reason?: string
  ) => {
    try {
      setUpdatingOrder(orderId);

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      // Refresh orders list
      await fetchOrders();
      onOrderUpdated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "pending-verification":
        return "outline";
      case "expired":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get time remaining for pending orders
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = expiry - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh for pending orders
  useEffect(() => {
    const interval = setInterval(() => {
      if (orders.some((order) => order.status === "pending")) {
        fetchOrders();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Orders Overview
          </h2>
          <p className="text-sm text-gray-600">
            Monitor and manage all payment orders
          </p>
        </div>
        <Button onClick={() => fetchOrders()} className="w-full sm:w-auto">
          Refresh
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
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Filter by status:
          </Label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="pending-verification">Pending Verification</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderId}
                      </div>
                      <div className="text-sm text-gray-500">{order.vpa}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.merchantName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace("-", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.utr || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.status === "pending"
                          ? getTimeRemaining(order.expiresAt)
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {order.status === "pending-verification" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.orderId,
                                  "completed",
                                  "Manual verification - approved"
                                )
                              }
                              disabled={updatingOrder === order.orderId}
                            >
                              {updatingOrder === order.orderId
                                ? "..."
                                : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.orderId,
                                  "failed",
                                  "Manual verification - rejected"
                                )
                              }
                              disabled={updatingOrder === order.orderId}
                            >
                              {updatingOrder === order.orderId
                                ? "..."
                                : "Reject"}
                            </Button>
                          </>
                        )}
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order.orderId,
                                "expired",
                                "Manual expiration"
                              )
                            }
                            disabled={updatingOrder === order.orderId}
                          >
                            {updatingOrder === order.orderId ? "..." : "Expire"}
                          </Button>
                        )}
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
