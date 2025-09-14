import { ClerkProvider } from "@clerk/nextjs";

export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL!,
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL!,
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL!,
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL!,
};

// Validate required environment variables
if (!clerkConfig.publishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable"
  );
}

if (!clerkConfig.secretKey) {
  throw new Error("Missing CLERK_SECRET_KEY environment variable");
}

export default clerkConfig;
