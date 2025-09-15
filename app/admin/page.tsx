"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useUserRole } from "@/lib/auth/client";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { UserManagement } from "@/components/admin/user-management";
import { OrdersOverview } from "@/components/admin/orders-overview";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { SettingsManagement } from "@/components/admin/settings-management";
import { AuditLogsViewer } from "@/components/admin/audit-logs-viewer";
import { DashboardErrorBoundary } from "@/components/error/error-boundary";

type AdminView =
  | "dashboard"
  | "users"
  | "orders"
  | "analytics"
  | "audit-logs"
  | "settings";

export default function AdminPage() {
  const { userId, isLoaded } = useAuth();
  const role = useUserRole();
  const [activeView, setActiveView] = useState<AdminView>("dashboard");

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Handle non-admin users
  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Admin Access Required
            </h1>
            <p className="text-gray-600 mb-6">
              You need administrator privileges to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Current role: {role || "No role assigned"}
            </p>
            <Button onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
            </Button>
            <div className="mt-6">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "users":
        return <UserManagement />;
      case "orders":
        return <OrdersOverview />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "audit-logs":
        return <AuditLogsViewer />;
      case "settings":
        return <SettingsManagement />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                System administration and user management
              </p>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8 scrollbar-hide">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView("analytics")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveView("users")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveView("orders")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveView("audit-logs")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "audit-logs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveView("settings")}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeView === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DashboardErrorBoundary>{renderActiveView()}</DashboardErrorBoundary>
        </div>
      </main>
    </div>
  );
}
