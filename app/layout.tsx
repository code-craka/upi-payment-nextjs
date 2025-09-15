import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UPI Payment System",
  description:
    "Self-hosted UPI payment link generator and order management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
    >
      <html lang="en">
        <body className={inter.className}>
          <ErrorBoundary>
            <ToastProvider>{children}</ToastProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
