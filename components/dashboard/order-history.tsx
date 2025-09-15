"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { OrderStatusTracker } from "@/components/payment/order-status-tracker";

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
  createdAt: string;
  expiresAt: string;
  paymentPageUrl: string;
}

interface OrderHistoryProps {
  initialOrders?: Order[];
  refreshTrigger?: number;
}

export function OrderHistory({
  initialOrders = [],
  refreshTrigger,
}: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (page = 1, status?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`/api/orders?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.data.orders);
      setTotalPages(data.data.pagination.totalPages);
      setCurrentPage(data.data.pagination.currentPage);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, selectedStatus);
  }, [selectedStatus, refreshTrigger]);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchOrders(page, selectedStatus);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "default"; // Green
      case "pending":
        return "secondary"; // Yellow
      case "pending-verification":
        return "outline"; // Blue
      case "expired":
        return "destructive"; // Red
      case "failed":
        return "destructive"; // Red
      default:
        return "secondary";
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentUrl = (orderId: string) => {
    return `${window.location.origin}/pay/${orderId}`;
  };

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchOrders(currentPage, selectedStatus)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Order History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track and manage your payment links
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            <div className="flex flex-wrap gap-2">
              {[
                "all",
                "pending",
                "pending-verification",
                "completed",
                "expired",
                "failed",
              ].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                >
                  {status === "all" ? "All" : status.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
            {selectedStatus !== "all" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleStatusFilter("all")}
              >
                View All Orders
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {order.orderId}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace("-", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Amount:</span>{" "}
                        {formatAmount(order.amount)}
                      </div>
                      <div>
                        <span className="font-medium">Merchant:</span>{" "}
                        {order.merchantName}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {formatDate(order.createdAt)}
                      </div>
                      {order.status === "pending" && (
                        <div>
                          <span className="font-medium">Expires:</span>{" "}
                          {formatDate(order.expiresAt)}
                        </div>
                      )}
                      {order.utr && (
                        <div>
                          <span className="font-medium">UTR:</span> {order.utr}
                        </div>
                      )}
                    </div>

                    {order.status !== "expired" &&
                      order.status !== "failed" && (
                        <div className="mt-3">
                          <OrderStatusTracker status={order.status} size="sm" />
                        </div>
                      )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(getPaymentUrl(order.orderId))
                      }
                    >
                      Copy Link
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(getPaymentUrl(order.orderId), "_blank")
                      }
                    >
                      View Page
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
