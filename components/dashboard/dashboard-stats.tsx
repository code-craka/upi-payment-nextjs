"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  recentCount: number;
}

interface DashboardStatsProps {
  refreshTrigger?: number;
}

export function DashboardStats({ refreshTrigger }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    byStatus: {},
    recentCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/orders/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const getStatusCount = (status: string): number => {
    return stats.byStatus[status] || 0;
  };

  const getSuccessRate = (): string => {
    const completed = getStatusCount("completed");
    const total = stats.total;

    if (total === 0) return "0%";

    const rate = (completed / total) * 100;
    return `${rate.toFixed(1)}%`;
  };

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Orders */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">₹</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Orders
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5" />
                  ) : (
                    stats.total.toLocaleString()
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Orders */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">✓</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Completed
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5" />
                  ) : (
                    getStatusCount("completed").toLocaleString()
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">⏳</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5" />
                  ) : (
                    (
                      getStatusCount("pending") +
                      getStatusCount("pending-verification")
                    ).toLocaleString()
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">%</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Success Rate
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5" />
                  ) : (
                    getSuccessRate()
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
