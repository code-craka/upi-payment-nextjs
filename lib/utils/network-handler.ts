/**
 * Network Error Handling and Retry Mechanisms
 * Provides robust network error handling with exponential backoff and retry logic
 */

import React from "react";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export interface NetworkError extends Error {
  code?: string;
  status?: number;
  retryable?: boolean;
}

/**
 * Creates a network error with additional metadata
 */
export function createNetworkError(
  message: string,
  code?: string,
  status?: number,
  retryable = true
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.name = "NetworkError";
  error.code = code;
  error.status = status;
  error.retryable = retryable;
  return error;
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === "NetworkError" && error.retryable !== false) {
    return true;
  }

  // Fetch API errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  // Connection errors
  if (error.code) {
    const retryableCodes = [
      "NETWORK_ERROR",
      "TIMEOUT_ERROR",
      "CONNECTION_ERROR",
      "ECONNRESET",
      "ENOTFOUND",
      "ECONNREFUSED",
    ];
    return retryableCodes.includes(error.code);
  }

  return false;
}

/**
 * Implements exponential backoff with jitter
 */
export function calculateDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000,
  backoffFactor = 2
): number {
  const delay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt),
    maxDelay
  );
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = isRetryableError,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Enhanced fetch with retry logic and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number; retryOptions?: RetryOptions } = {}
): Promise<Response> {
  const { timeout = 10000, retryOptions, ...fetchOptions } = options;

  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createNetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          "HTTP_ERROR",
          response.status,
          response.status >= 500 || response.status === 429
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw createNetworkError("Request timeout", "TIMEOUT_ERROR");
      }

      if (error instanceof TypeError) {
        throw createNetworkError(
          "Network connection failed",
          "CONNECTION_ERROR"
        );
      }

      throw error;
    }
  };

  return withRetry(fetchWithTimeout, retryOptions);
}

/**
 * UPI app redirect with fallback handling
 */
export class UPIRedirectHandler {
  private static readonly APP_STORE_LINKS = {
    gpay: "https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user",
    phonepe: "https://play.google.com/store/apps/details?id=com.phonepe.app",
    paytm: "https://play.google.com/store/apps/details?id=net.one97.paytm",
    bhim: "https://play.google.com/store/apps/details?id=in.org.npci.upiapp",
  };

  private static readonly IOS_APP_STORE_LINKS = {
    gpay: "https://apps.apple.com/app/google-pay/id1193357041",
    phonepe: "https://apps.apple.com/app/phonepe/id1170055821",
    paytm: "https://apps.apple.com/app/paytm/id473941634",
    bhim: "https://apps.apple.com/app/bhim-upi/id1200315258",
  };

  static async redirectToUPIApp(
    appName: keyof typeof UPIRedirectHandler.APP_STORE_LINKS,
    upiLink: string,
    options: {
      fallbackDelay?: number;
      onFallback?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    const { fallbackDelay = 3000, onFallback, onError } = options;

    try {
      // Detect platform
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      // Try to open UPI app
      const startTime = Date.now();

      // Create a hidden iframe to attempt the redirect
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = upiLink;
      document.body.appendChild(iframe);

      // Set up fallback timer
      const fallbackTimer = setTimeout(() => {
        document.body.removeChild(iframe);

        // Check if user is still on the page (app didn't open)
        const timeElapsed = Date.now() - startTime;
        if (timeElapsed >= fallbackDelay - 100) {
          this.handleFallback(appName, isIOS, isAndroid, onFallback);
        }
      }, fallbackDelay);

      // Listen for page visibility change (app opened successfully)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearTimeout(fallbackTimer);
          document.body.removeChild(iframe);
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Also try direct window location as backup
      setTimeout(() => {
        try {
          window.location.href = upiLink;
        } catch (error) {
          console.warn("Direct redirect failed:", error);
        }
      }, 100);
    } catch (error) {
      console.error("UPI redirect error:", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private static handleFallback(
    appName: keyof typeof UPIRedirectHandler.APP_STORE_LINKS,
    isIOS: boolean,
    isAndroid: boolean,
    onFallback?: () => void
  ): void {
    if (onFallback) {
      onFallback();
    }

    // Open appropriate app store
    const storeLinks = isIOS ? this.IOS_APP_STORE_LINKS : this.APP_STORE_LINKS;
    const storeLink = storeLinks[appName];

    if (storeLink) {
      window.open(storeLink, "_blank");
    }
  }

  static isUPISupported(): boolean {
    // Check if device supports UPI (mobile devices)
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    return isMobile;
  }

  static getRecommendedApps(): string[] {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isAndroid) {
      return ["gpay", "phonepe", "paytm", "bhim"];
    } else if (isIOS) {
      return ["gpay", "phonepe", "paytm"];
    }

    return [];
  }
}

/**
 * API client with built-in retry and error handling
 */
export class APIClient {
  private baseURL: string;
  private defaultOptions: RequestInit;

  constructor(baseURL = "", defaultOptions: RequestInit = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        ...defaultOptions.headers,
      },
      ...defaultOptions,
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { retryOptions?: RetryOptions } = {}
  ): Promise<T> {
    const { retryOptions, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetchWithRetry(url, {
      ...this.defaultOptions,
      ...fetchOptions,
      retryOptions,
    });

    const data = await response.json();

    if (!response.ok) {
      throw createNetworkError(
        data.error || `HTTP ${response.status}`,
        data.code || "API_ERROR",
        response.status
      );
    }

    return data;
  }

  async get<T>(
    endpoint: string,
    options?: RequestInit & { retryOptions?: RetryOptions }
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { retryOptions?: RetryOptions }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: RequestInit & { retryOptions?: RetryOptions }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    options?: RequestInit & { retryOptions?: RetryOptions }
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

/**
 * Global API client instance
 */
export const apiClient = new APIClient("/api");

/**
 * Hook for handling network operations with loading and error states
 */
export function useNetworkOperation<T>() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NetworkError | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = async (
    operation: () => Promise<T>,
    retryOptions?: RetryOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(operation, retryOptions);
      setData(result);
      return result;
    } catch (err) {
      const networkError =
        err instanceof Error
          ? createNetworkError(err.message, "OPERATION_ERROR")
          : createNetworkError("Unknown error occurred");

      setError(networkError);
      throw networkError;
    } finally {
      setLoading(false);
    }
  };

  const retry = async (
    operation: () => Promise<T>,
    retryOptions?: RetryOptions
  ) => {
    return execute(operation, retryOptions);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    loading,
    error,
    data,
    execute,
    retry,
    reset,
  };
}
