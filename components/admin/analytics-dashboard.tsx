"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AnalyticsData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  systemHealth: {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    conversionRate: number;
    failureRate: number;
    verificationPendingRate: number;
    avgOrdersPerUser: number;
  };
  actionStats: Array<{
    action: string;
    count: number;
    lastOccurrence: string;
  }>;
  userActivityStats: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalActions: number;
    actionBreakdown: Record<string, number>;
    lastActivity: string;
  }>;
  merchantPerformance: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalOrders: number;
    completedOrders: number;
    successRate: number;
    lastActivity: string;
  }>;
  orderMetrics: {
    total: number;
    byStatus: Record<string, number>;
    conversionRate: number;
    failureRate: number;
    verificationPendingRate: number;
  };
  activityTimeline: {
    orderActivity: Array<{
      action: string;
      entityId: string;
      userName: string;
      timestamp: string;
      details: any;
    }>;
    userManagementActivity: Array<{
      action: string;
      entityId: string;
      userName: string;
      timestamp: string;
      details: any;
    }>;
    settingsActivity: Array<{
      action: string;
      userName: string;
      timestamp: string;
      details: any;
    }>;
  };
  trends: {
    activityByDay: Array<{
      date: string;
      totalActions: number;
      actionBreakdown: Record<string, number>;
    }>;
  };
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/admin/analytics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error loading analytics: {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 text-gray-600">No analytics data available.</div>
    );
  }

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "pending-verification":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      case "expired":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="border rounded px-3 py-2"
              />
            </div>
            <Button onClick={handleDateRangeChange}>Update Analytics</Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.systemHealth.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.systemHealth.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.systemHealth.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.systemHealth.avgOrdersPerUser} avg per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.systemHealth.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.systemHealth.verificationPendingRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting UTR verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.orderMetrics.byStatus).map(
              ([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded ${getStatusColor(status)}`}
                    ></div>
                    <span className="capitalize">
                      {formatActionName(status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{count}</span>
                    <span className="text-sm text-gray-500">
                      (
                      {((count / analytics.orderMetrics.total) * 100).toFixed(
                        1
                      )}
                      %)
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.actionStats.map((stat) => (
              <div
                key={stat.action}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">
                    {formatActionName(stat.action)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Last: {new Date(stat.lastOccurrence).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <div className="text-sm text-gray-500">actions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Merchants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.merchantPerformance.slice(0, 5).map((merchant) => (
              <div
                key={merchant.userId}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{merchant.userName}</div>
                  <div className="text-sm text-gray-600">
                    {merchant.userEmail}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {merchant.totalOrders} orders
                  </div>
                  <div className="text-sm">
                    <Badge
                      variant={
                        merchant.successRate > 80 ? "default" : "secondary"
                      }
                    >
                      {merchant.successRate.toFixed(1)}% success
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Order Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.activityTimeline.orderActivity
                .slice(0, 10)
                .map((activity, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-blue-200 pl-3"
                  >
                    <div className="font-medium">
                      {formatActionName(activity.action)}
                    </div>
                    <div className="text-gray-600">
                      {activity.userName} • {activity.entityId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* User Management Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.activityTimeline.userManagementActivity
                .slice(0, 10)
                .map((activity, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-green-200 pl-3"
                  >
                    <div className="font-medium">
                      {formatActionName(activity.action)}
                    </div>
                    <div className="text-gray-600">by {activity.userName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Settings Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {analytics.activityTimeline.settingsActivity
                .slice(0, 10)
                .map((activity, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-purple-200 pl-3"
                  >
                    <div className="font-medium">Settings Updated</div>
                    <div className="text-gray-600">by {activity.userName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                    {activity.details && (
                      <div className="text-xs text-gray-600 mt-1">
                        {Object.keys(activity.details).join(", ")} changed
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
