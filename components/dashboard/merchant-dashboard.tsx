"use client";

import { useState } from "react";
import { User } from "@clerk/nextjs/server";
import { UserProfile } from "@/components/auth/user-profile";
import { Button } from "@/components/ui/button";
import { PaymentLinkForm } from "./payment-link-form";
import { OrderHistory } from "./order-history";
import { DashboardStats } from "./dashboard-stats";
import { LinkSharing } from "./link-sharing";

interface MerchantDashboardProps {
  user: User;
  role: string;
}

type ActiveTab = "overview" | "create" | "orders";

interface CreatedOrder {
  orderId: string;
  paymentPageUrl: string;
  amount: number;
  merchantName: string;
  vpa: string;
  expiresAt: string;
}

export function MerchantDashboard({ user, role }: MerchantDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentlyCreatedOrder, setRecentlyCreatedOrder] =
    useState<CreatedOrder | null>(null);
  const [showLinkSharing, setShowLinkSharing] = useState(false);

  const handleOrderCreated = (orderData: CreatedOrder) => {
    setRecentlyCreatedOrder(orderData);
    setShowLinkSharing(true);
    setRefreshTrigger((prev) => prev + 1);

    // Auto-switch to orders tab after a delay
    setTimeout(() => {
      setActiveTab("orders");
    }, 3000);
  };

  const handleCloseLinkSharing = () => {
    setShowLinkSharing(false);
    setRecentlyCreatedOrder(null);
  };

  const getTabButtonClass = (tab: ActiveTab) => {
    const baseClass =
      "px-4 py-2 text-sm font-medium rounded-md transition-colors";
    return activeTab === tab
      ? `${baseClass} bg-blue-100 text-blue-700`
      : `${baseClass} text-gray-500 hover:text-gray-700 hover:bg-gray-100`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                UPI Payment Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your payment links and orders
              </p>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="mb-6 sm:mb-8">
            <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={getTabButtonClass("overview")}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={getTabButtonClass("create")}
              >
                Create Link
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={getTabButtonClass("orders")}
              >
                Order History
              </button>
            </nav>
          </div>

          {/* Success Message for Recently Created Order */}
          {recentlyCreatedOrder && showLinkSharing && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Payment Link Created Successfully!
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Order ID: {recentlyCreatedOrder.orderId} | Amount: ₹
                        {recentlyCreatedOrder.amount}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseLinkSharing}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Link Sharing Component */}
          {recentlyCreatedOrder && showLinkSharing && (
            <div className="mb-6">
              <LinkSharing
                orderId={recentlyCreatedOrder.orderId}
                paymentUrl={`${window.location.origin}${recentlyCreatedOrder.paymentPageUrl}`}
                onClose={handleCloseLinkSharing}
              />
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome back, {user.firstName}!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your UPI payment system is ready to use. Here&apos;s your
                    dashboard overview.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => setActiveTab("create")}
                      className="w-full sm:w-auto"
                    >
                      Create Payment Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("orders")}
                      className="w-full sm:w-auto"
                    >
                      View Orders
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dashboard Statistics */}
              <DashboardStats refreshTrigger={refreshTrigger} />

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("create")}
                  >
                    <span className="text-2xl mb-2">➕</span>
                    <span>Create New Link</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("orders")}
                  >
                    <span className="text-2xl mb-2">📋</span>
                    <span>View All Orders</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => window.open("/pay/demo", "_blank")}
                  >
                    <span className="text-2xl mb-2">👁️</span>
                    <span>Preview Payment Page</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-6">
              <PaymentLinkForm onSuccess={handleOrderCreated} />

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  How to use Payment Links
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    • Fill in the amount and merchant name to create a payment
                    link
                  </p>
                  <p>
                    • UPI ID is optional - leave empty to use the system default
                  </p>
                  <p>
                    • Share the generated link with your customers via WhatsApp,
                    SMS, or email
                  </p>
                  <p>
                    • Customers can pay using any UPI app (GPay, PhonePe, Paytm,
                    BHIM)
                  </p>
                  <p>
                    • Track payment status and UTR submissions in the Order
                    History
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <OrderHistory refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
