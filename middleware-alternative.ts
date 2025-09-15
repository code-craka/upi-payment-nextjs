import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/pay/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/debug/(.*)",
]);

// Define protected API routes
const isProtectedApiRoute = createRouteMatcher([
  "/api/orders(.*)",
  "/api/admin/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Always allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Handle API routes
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For admin API routes, let the API endpoint handle the permission check
    // This allows the API to fetch fresh user data from Clerk
    return NextResponse.next();
  }

  // For page routes, let the page handle authentication
  // This prevents redirect loops and allows pages to show appropriate error messages
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
