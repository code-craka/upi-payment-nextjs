"use client";

import React, { createContext, useContext } from "react";
import { Toast, useToast } from "@/components/error/error-messages";

interface ToastContextType {
  showToast: (toast: {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, showToast, dismissToast, dismissAll } = useToast();

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, dismissAll }}>
      {children}

      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}
