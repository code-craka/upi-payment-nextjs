"use client";

import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

interface OrderStatusTrackerProps {
  currentStatus: string;
  utr?: string;
  createdAt: string;
  utrSubmittedAt?: string;
}

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusSteps: StatusStep[] = [
  {
    key: "pending",
    label: "Payment Initiated",
    description: "Order created, awaiting payment",
    icon: Clock,
  },
  {
    key: "pending-verification",
    label: "UTR Submitted",
    description: "Payment confirmation received, under verification",
    icon: AlertCircle,
  },
  {
    key: "completed",
    label: "Payment Verified",
    description: "Payment successfully verified and completed",
    icon: CheckCircle,
  },
];

export default function OrderStatusTracker({
  currentStatus,
  utr,
  createdAt,
  utrSubmittedAt,
}: OrderStatusTrackerProps) {
  // Don't show tracker for expired or failed orders
  if (currentStatus === "expired" || currentStatus === "failed") {
    return null;
  }

  const getCurrentStepIndex = () => {
    switch (currentStatus) {
      case "pending":
        return 0;
      case "pending-verification":
        return 1;
      case "completed":
        return 2;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "upcoming";
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case "completed":
        return {
          container: "bg-green-50 border-green-200",
          icon: "bg-green-500 text-white",
          text: "text-green-800",
          description: "text-green-600",
        };
      case "current":
        return {
          container: "bg-blue-50 border-blue-200 ring-2 ring-blue-300",
          icon: "bg-blue-500 text-white animate-pulse",
          text: "text-blue-800 font-semibold",
          description: "text-blue-600",
        };
      case "upcoming":
        return {
          container: "bg-gray-50 border-gray-200",
          icon: "bg-gray-300 text-gray-500",
          text: "text-gray-500",
          description: "text-gray-400",
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          icon: "bg-gray-300 text-gray-500",
          text: "text-gray-500",
          description: "text-gray-400",
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-center text-gray-900">
        Order Progress
      </h3>

      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const styles = getStepStyles(stepStatus);
          const Icon = step.icon;

          return (
            <div key={step.key}>
              <div
                className={`flex items-start p-4 rounded-lg border transition-all duration-200 ${styles.container}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="ml-4 flex-1">
                  <div className={`font-medium ${styles.text}`}>
                    {step.label}
                  </div>
                  <div className={`text-sm mt-1 ${styles.description}`}>
                    {step.description}
                  </div>

                  {/* Show timestamps for completed/current steps */}
                  {stepStatus === "completed" || stepStatus === "current" ? (
                    <div className="text-xs text-gray-500 mt-2">
                      {step.key === "pending" && (
                        <span>Created: {formatDateTime(createdAt)}</span>
                      )}
                      {step.key === "pending-verification" &&
                        utrSubmittedAt && (
                          <span>
                            Submitted: {formatDateTime(utrSubmittedAt)}
                          </span>
                        )}
                      {step.key === "completed" &&
                        stepStatus === "completed" && (
                          <span>
                            Verified: {formatDateTime(new Date().toISOString())}
                          </span>
                        )}
                    </div>
                  ) : null}

                  {/* Show UTR for verification step */}
                  {step.key === "pending-verification" &&
                    (stepStatus === "completed" || stepStatus === "current") &&
                    utr && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <div className="text-xs text-gray-600 mb-1">
                          UTR Number:
                        </div>
                        <div className="font-mono text-sm font-medium text-gray-900">
                          {utr}
                        </div>
                      </div>
                    )}
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0 ml-2">
                  {stepStatus === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {stepStatus === "current" && (
                    <div className="h-5 w-5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < statusSteps.length - 1 && (
                <div className="flex justify-center py-2">
                  <div
                    className={`w-0.5 h-4 ${
                      index < currentStepIndex
                        ? "bg-green-500"
                        : index === currentStepIndex
                          ? "bg-blue-500"
                          : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current status summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 text-center">
          <strong>Current Status:</strong>{" "}
          {currentStatus === "pending" && "Awaiting payment completion"}
          {currentStatus === "pending-verification" &&
            "Payment under verification"}
          {currentStatus === "completed" && "Payment successfully completed"}
        </div>

        {currentStatus === "pending-verification" && (
          <div className="text-xs text-gray-500 text-center mt-2">
            Your payment is being verified. You will be notified once it&apos;s
            confirmed.
          </div>
        )}
      </div>
    </div>
  );
}
