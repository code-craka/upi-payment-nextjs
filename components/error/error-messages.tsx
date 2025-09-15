"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";

/**
 * Error message configurations with user-friendly text and actions
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: {
    title: "Connection Problem",
    message:
      "We're having trouble connecting to our servers. Please check your internet connection and try again.",
    icon: () => (
      <Image src="/icons/wifi.svg" alt="Wifi" width={20} height={20} />
    ),
    color: "red",
    retryable: true,
  },
  TIMEOUT_ERROR: {
    title: "Request Timeout",
    message:
      "The request is taking longer than expected. This might be due to a slow connection.",
    icon: Clock,
    color: "orange",
    retryable: true,
  },

  // Authentication errors
  AUTHENTICATION_ERROR: {
    title: "Authentication Required",
    message:
      "Please sign in to continue. You'll be redirected to the login page.",
    icon: () => (
      <Image src="/icons/shield.svg" alt="Shield" width={20} height={20} />
    ),
    color: "blue",
    retryable: false,
  },
  AUTHORIZATION_ERROR: {
    title: "Access Denied",
    message:
      "You don't have permission to access this resource. Contact your administrator if you believe this is an error.",
    icon: () => (
      <Image src="/icons/shield.svg" alt="Shield" width={20} height={20} />
    ),
    color: "red",
    retryable: false,
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: "Invalid Information",
    message: "Please check the information you entered and try again.",
    icon: AlertCircle,
    color: "orange",
    retryable: false,
  },

  // Payment errors
  ORDER_EXPIRED: {
    title: "Payment Link Expired",
    message:
      "This payment link has expired. Please request a new payment link from the merchant.",
    icon: Clock,
    color: "orange",
    retryable: false,
  },
  ORDER_NOT_FOUND: {
    title: "Payment Not Found",
    message:
      "We couldn't find this payment. Please check the link and try again.",
    icon: AlertCircle,
    color: "red",
    retryable: false,
  },
  INVALID_UTR: {
    title: "Invalid UTR Number",
    message:
      "The UTR number you entered is not valid. Please check and enter the 12-digit UTR from your payment app.",
    icon: () => (
      <Image
        src="/icons/credit-card.svg"
        alt="Credit Card"
        width={20}
        height={20}
      />
    ),
    color: "orange",
    retryable: false,
  },

  // UPI app errors
  UPI_APP_ERROR: {
    title: "UPI App Not Available",
    message:
      "We couldn't open your UPI app. Please make sure it's installed and try again, or use manual payment.",
    icon: () => (
      <Image
        src="/icons/credit-card.svg"
        alt="Credit Card"
        width={20}
        height={20}
      />
    ),
    color: "orange",
    retryable: true,
  },

  // Server errors
  SERVER_ERROR: {
    title: "Server Error",
    message:
      "Something went wrong on our end. Our team has been notified and is working to fix this.",
    icon: AlertCircle,
    color: "red",
    retryable: true,
  },
  DATABASE_ERROR: {
    title: "Data Error",
    message:
      "We're having trouble accessing your data. Please try again in a moment.",
    icon: AlertCircle,
    color: "red",
    retryable: true,
  },

  // Rate limiting
  RATE_LIMIT_ERROR: {
    title: "Too Many Requests",
    message:
      "You're making requests too quickly. Please wait a moment and try again.",
    icon: Clock,
    color: "orange",
    retryable: true,
  },

  // Business logic errors
  DUPLICATE_UTR: {
    title: "UTR Already Submitted",
    message:
      "This UTR number has already been used for another payment. Please check your transaction history.",
    icon: AlertCircle,
    color: "orange",
    retryable: false,
  },
  INSUFFICIENT_PERMISSIONS: {
    title: "Insufficient Permissions",
    message: "You don't have the required permissions to perform this action.",
    icon: () => (
      <Image src="/icons/shield.svg" alt="Shield" width={20} height={20} />
    ),
    color: "red",
    retryable: false,
  },
} as const;

interface ErrorDisplayProps {
  error: {
    code?: string;
    message?: string;
    status?: number;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false,
}: ErrorDisplayProps) {
  const errorConfig =
    error.code && error.code in ERROR_MESSAGES
      ? ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]
      : ERROR_MESSAGES.SERVER_ERROR;

  const Icon = errorConfig.icon;
  const colorClasses = {
    red: "text-red-500 bg-red-50 border-red-200",
    orange: "text-orange-500 bg-orange-50 border-orange-200",
    blue: "text-blue-500 bg-blue-50 border-blue-200",
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-md border ${colorClasses[errorConfig.color]}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {errorConfig.title}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {error.message || errorConfig.message}
          </p>
        </div>
        {onRetry && errorConfig.retryable && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <Image
              src="/icons/rotate-cw.svg"
              alt="Retry"
              width={16}
              height={16}
              className="h-4 w-4"
            />
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[errorConfig.color]}`}>
      <div className="flex items-start gap-4">
        <Icon className="h-6 w-6 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {errorConfig.title}
          </h3>
          <p className="text-gray-700 mb-4">
            {error.message || errorConfig.message}
          </p>

          {showDetails && error.code && (
            <div className="bg-white/50 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-700">
                Error Details:
              </p>
              <p className="text-sm text-gray-600 font-mono">
                Code: {error.code}
                {error.status && ` | Status: ${error.status}`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {onRetry && errorConfig.retryable && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <Image
                  src="/icons/rotate-cw.svg"
                  alt="Retry"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                Try Again
              </Button>
            )}

            {error.code === "AUTHENTICATION_ERROR" && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/sign-in")}
              >
                Sign In
              </Button>
            )}

            {error.code === "ORDER_EXPIRED" && (
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            )}

            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SuccessMessageProps {
  title: string;
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function SuccessMessage({
  title,
  message,
  onDismiss,
  action,
}: SuccessMessageProps) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6">
      <div className="flex items-start gap-4">
        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700 mb-4">{message}</p>

          <div className="flex gap-3">
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({
  message = "Loading...",
  subMessage,
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-900 font-medium">{message}</p>
      {subMessage && <p className="text-gray-600 text-sm mt-1">{subMessage}</p>}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  message,
  action,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && <Icon className="h-12 w-12 text-gray-400 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

/**
 * Toast notification for temporary messages
 */
interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const typeConfig = {
    success: { icon: CheckCircle, color: "green" },
    error: { icon: XCircle, color: "red" },
    warning: { icon: AlertCircle, color: "orange" },
    info: { icon: AlertCircle, color: "blue" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-${config.color}-200 rounded-lg shadow-lg p-4`}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`h-5 w-5 text-${config.color}-500 flex-shrink-0 mt-0.5`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<
    Array<ToastProps & { id: string }>
  >([]);

  const showToast = React.useCallback(
    (toast: Omit<ToastProps, "onDismiss">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = {
        ...toast,
        id,
        onDismiss: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
  };
}
