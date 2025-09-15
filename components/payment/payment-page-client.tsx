"use client";

import { useState, useEffect } from "react";
import { Copy, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/payment/countdown-timer";
import UpiButtons from "@/components/payment/upi-buttons";
import UtrForm from "@/components/payment/utr-form";
import QRCodeDisplay from "@/components/payment/qr-code-display";
import OrderStatusTracker from "@/components/payment/order-status-tracker";

interface OrderData {
  orderId: string;
  amount: number;
  merchantName: string;
  vpa: string;
  status: string;
  utr?: string;
  createdAt: string;
  expiresAt: string;
  canSubmitUTR: boolean;
  utrSubmittedAt?: string;
}

interface SettingsData {
  timerDuration: number;
  enabledUpiApps: {
    gpay: boolean;
    phonepe: boolean;
    paytm: boolean;
    bhim: boolean;
  };
  staticUpiId?: string;
}

interface PaymentPageClientProps {
  order: OrderData;
  settings: SettingsData;
  upiLinks: Record<string, string>;
  enabledApps: string[];
  initialTimeRemaining: number;
}

export default function PaymentPageClient({
  order,
  settings,
  upiLinks,
  enabledApps,
  initialTimeRemaining,
}: PaymentPageClientProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [isExpired, setIsExpired] = useState(
    order.status === "expired" || initialTimeRemaining <= 0
  );
  const [showManualUpi, setShowManualUpi] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Handle timer expiration
  const handleTimerExpire = () => {
    setIsExpired(true);
    setTimeRemaining(0);
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "pending-verification":
        return "secondary";
      case "completed":
        return "default";
      case "expired":
        return "destructive";
      case "failed":
        return "destructive";
      default:
        return "default";
    }
  };

  // Get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    const iconProps = { className: "h-4 w-4" };
    switch (status) {
      case "pending":
        return <Clock {...iconProps} />;
      case "pending-verification":
        return <AlertCircle {...iconProps} />;
      case "completed":
        return <CheckCircle {...iconProps} />;
      case "expired":
      case "failed":
        return <XCircle {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  // Format status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Awaiting Payment";
      case "pending-verification":
        return "Under Verification";
      case "completed":
        return "Payment Completed";
      case "expired":
        return "Payment Expired";
      case "failed":
        return "Payment Failed";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Request
            </h1>
            <Badge
              variant={getStatusBadgeVariant(order.status)}
              className="flex items-center gap-1 w-fit mx-auto"
            >
              <StatusIcon status={order.status} />
              {getStatusText(order.status)}
            </Badge>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                ₹{order.amount.toLocaleString("en-IN")}
              </div>
              <div className="text-sm sm:text-base text-gray-600">
                to {order.merchantName}
              </div>
            </div>

            {/* UPI ID with copy button */}
            <div className="space-y-2">
              <Label htmlFor="upi-id" className="text-sm font-medium">
                UPI ID
              </Label>
              <div className="flex gap-2">
                <Input
                  id="upi-id"
                  value={order.vpa}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(order.vpa, "upi")}
                  className="px-3 min-h-[44px] touch-manipulation"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copiedField === "upi" && (
                <div className="text-sm text-green-600">UPI ID copied!</div>
              )}
            </div>

            {/* Amount with copy button */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  value={`₹${order.amount}`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(order.amount.toString(), "amount")
                  }
                  className="px-3 min-h-[44px] touch-manipulation"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copiedField === "amount" && (
                <div className="text-sm text-green-600">Amount copied!</div>
              )}
            </div>

            {/* Order ID */}
            <div className="text-sm text-gray-500 text-center">
              Order ID: {order.orderId}
            </div>
          </div>
        </div>

        {/* Timer */}
        {!isExpired && order.status === "pending" && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <CountdownTimer
              expiresAt={new Date(order.expiresAt)}
              onExpire={handleTimerExpire}
            />
          </div>
        )}

        {/* Payment Status Messages */}
        {order.status === "pending-verification" && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your UTR has been submitted successfully. The payment is now under
              verification.
              {order.utr && (
                <div className="mt-2 font-medium">UTR: {order.utr}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {order.status === "completed" && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Payment completed successfully! Thank you for your payment.
            </AlertDescription>
          </Alert>
        )}

        {order.status === "expired" && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              This payment link has expired. Please contact the merchant for a
              new payment link.
            </AlertDescription>
          </Alert>
        )}

        {order.status === "failed" && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Payment verification failed. Please contact the merchant for
              assistance.
            </AlertDescription>
          </Alert>
        )}

        {/* UPI App Buttons */}
        {!isExpired && order.status === "pending" && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Pay with UPI App
            </h2>
            <UpiButtons
              upiLinks={upiLinks}
              enabledApps={enabledApps}
              settings={settings}
            />

            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowManualUpi(!showManualUpi)}
                className="text-sm min-h-[44px] touch-manipulation"
              >
                {showManualUpi ? "Hide" : "Show"} Manual UPI Options
              </Button>
            </div>
          </div>
        )}

        {/* Manual UPI Options */}
        {showManualUpi && !isExpired && order.status === "pending" && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Manual UPI Payment
            </h3>
            <QRCodeDisplay
              upiLink={upiLinks.standard}
              amount={order.amount}
              merchantName={order.merchantName}
            />
          </div>
        )}

        {/* Order Status Tracker */}
        {(order.status === "pending-verification" ||
          order.status === "completed") && (
          <div className="mb-6">
            <OrderStatusTracker
              status={order.status}
              utr={order.utr}
              createdAt={order.createdAt}
              utrSubmittedAt={order.utrSubmittedAt}
            />
          </div>
        )}

        {/* UTR Submission Form */}
        {order.canSubmitUTR && !isExpired && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Submit Payment Confirmation
            </h2>
            <UtrForm orderId={order.orderId} />
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Secure payment powered by UPI</p>
          <p className="mt-1">
            Created on {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
