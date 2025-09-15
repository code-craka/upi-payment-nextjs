"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
  showRetry?: boolean;
}

export function NetworkError({
  onRetry,
  message = "Network connection failed",
  showRetry = true,
}: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image
          src="/icons/wifi-off.svg"
          alt="No Connection"
          width={48}
          height={48}
          className="h-12 w-12 text-red-500"
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connection Problem
      </h3>

      <p className="text-gray-600 mb-4 max-w-sm">
        {message}. Please check your internet connection and try again.
      </p>

      {showRetry && onRetry && (
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
    </div>
  );
}

interface UPIAppErrorProps {
  appName: string;
  onRetry?: () => void;
  onUseManual?: () => void;
}

export function UPIAppError({
  appName,
  onRetry,
  onUseManual,
}: UPIAppErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="flex justify-center mb-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {appName} Not Available
      </h3>

      <p className="text-gray-600 mb-4 max-w-sm">
        We couldn&apos;t open {appName}. The app might not be installed or there
        might be a temporary issue.
      </p>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {onRetry && (
          <Button onClick={onRetry} className="w-full">
            <Image
              src="/icons/rotate-cw.svg"
              alt="Retry"
              width={16}
              height={16}
              className="h-4 w-4 mr-2"
            />
            Try {appName} Again
          </Button>
        )}

        {onUseManual && (
          <Button variant="outline" onClick={onUseManual} className="w-full">
            Use Manual Payment
          </Button>
        )}
      </div>
    </div>
  );
}

interface FormErrorProps {
  errors: string[];
  onDismiss?: () => void;
}

export function FormError({ errors, onDismiss }: FormErrorProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Dismiss</span>×
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function LoadingError({
  message = "Failed to load data",
  onRetry,
}: LoadingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size="sm">
          <Image
            src="/icons/rotate-cw.svg"
            alt="Retry"
            width={16}
            height={16}
            className="h-4 w-4 mr-2"
          />
          Retry
        </Button>
      )}
    </div>
  );
}
