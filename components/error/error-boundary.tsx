"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import Image from "next/image";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console
    console.error("Error Boundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Placeholder for external error logging
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In a real app, send to error tracking service
    console.log("Error logged to service:", errorData);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page
              or contact support if the problem persists.
            </p>

            {this.props.showDetails && this.state.error && (
              <div className="bg-gray-100 rounded-md p-3 mb-4 text-left">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Error Details:
                </p>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <Image
                  src="/icons/rotate-cw.svg"
                  alt="Retry"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Payment-specific error boundary with UPI-related error handling
 */
export class PaymentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    console.error("Payment Error Boundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Error
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an error while processing your payment. Please try
              again or use a different payment method.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Make sure your UPI app is installed and
                updated to the latest version.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} className="w-full">
                <Image
                  src="/icons/rotate-cw.svg"
                  alt="Retry"
                  width={16}
                  height={16}
                  className="h-4 w-4 mr-2"
                />
                Retry Payment
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoBack}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Dashboard-specific error boundary
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    console.error(
      "Dashboard Error Boundary caught an error:",
      error,
      errorInfo
    );

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-orange-500" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard Error
            </h1>

            <p className="text-gray-600 mb-6">
              We&apos;re having trouble loading your dashboard. This might be a
              temporary issue with our servers.
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} className="w-full">
                <Image
                  src="/icons/rotate-cw.svg"
                  alt="Retry"
                  width={16}
                  height={16}
                  className="h-4 w-4 mr-2"
                />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={this.handleRefreshPage}
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Async error caught:", error);
    setError(error);

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service
      console.log("Async error logged to service:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}
