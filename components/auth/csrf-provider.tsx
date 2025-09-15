"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { generateCSRFToken } from "@/lib/utils/csrf-protection";

interface CSRFContextType {
  token: string | null;
  refreshToken: () => void;
}

const CSRFContext = createContext<CSRFContextType>({
  token: null,
  refreshToken: () => {},
});

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = () => {
    const newToken = generateCSRFToken();
    setToken(newToken);

    // Set token in cookie
    document.cookie = `csrf-token=${newToken}; path=/; secure; samesite=strict; max-age=${60 * 60 * 24}`;
  };

  useEffect(() => {
    // Generate new token on mount
    refreshToken();
  }, []);

  return (
    <CSRFContext.Provider value={{ token, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error("useCSRF must be used within a CSRFProvider");
  }
  return context;
}

/**
 * Hook to get CSRF headers for API requests
 */
export function useCSRFHeaders() {
  const { token } = useCSRF();

  return token ? { "x-csrf-token": token } : {};
}

/**
 * Enhanced fetch with CSRF protection
 */
export function useSecureFetch() {
  const csrfHeaders = useCSRFHeaders();

  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...csrfHeaders,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: "include", // Include cookies
    });
  };

  return secureFetch;
}
