"use client";

import { FormEvent, ReactNode } from "react";
import { useCSRF, useSecureFetch } from "@/components/auth/csrf-provider";
import { InputSanitizer } from "@/lib/utils/sanitization";

interface SecureFormProps {
  onSubmit: (data: FormData, secureFetch: typeof fetch) => Promise<void>;
  children: ReactNode;
  className?: string;
  sanitizeInputs?: boolean;
}

export function SecureForm({
  onSubmit,
  children,
  className = "",
  sanitizeInputs = true,
}: SecureFormProps) {
  const { token } = useCSRF();
  const secureFetch = useSecureFetch();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Sanitize form inputs if enabled
    if (sanitizeInputs) {
      const sanitizedData = new FormData();

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          sanitizedData.append(key, InputSanitizer.sanitizeText(value));
        } else {
          sanitizedData.append(key, value);
        }
      }

      await onSubmit(sanitizedData, secureFetch);
    } else {
      await onSubmit(formData, secureFetch);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* CSRF Token */}
      {token && <input type="hidden" name="csrf-token" value={token} />}
      {children}
    </form>
  );
}

/**
 * Hook for secure API calls with CSRF protection
 */
export function useSecureAPI() {
  const secureFetch = useSecureFetch();

  const securePost = async (url: string, data: any) => {
    return secureFetch(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  const securePut = async (url: string, data: any) => {
    return secureFetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  };

  const secureDelete = async (url: string) => {
    return secureFetch(url, {
      method: "DELETE",
    });
  };

  const secureGet = async (url: string) => {
    return secureFetch(url, {
      method: "GET",
    });
  };

  return {
    post: securePost,
    put: securePut,
    delete: secureDelete,
    get: secureGet,
    fetch: secureFetch,
  };
}
