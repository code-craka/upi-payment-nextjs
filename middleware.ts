import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { addSecurityHeaders } from "@/lib/middleware/security-middleware";

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
  const { userId, sessionClaims } = await auth();

  // Create response with security headers
  let response: NextResponse;

  // Always allow public routes
  if (isPublicRoute(req)) {
    response = NextResponse.next();
  }

  // Handle API routes
  else if (isProtectedApiRoute(req)) {
    if (!userId) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    } else {
      // Check admin permissions for admin API routes
      if (req.nextUrl.pathname.startsWith("/api/admin")) {
        const userRole = (sessionClaims?.metadata as any)?.role as string;
        if (userRole !== "admin") {
          response = NextResponse.json(
            { error: "Admin access required" },
            { status: 403 }
          );
        } else {
          response = NextResponse.next();
        }
      } else {
        response = NextResponse.next();
      }
    }
  }
  // For all other routes, let the page handle authentication
  else {
    response = NextResponse.next();
  }

  // Add security headers to all responses
  return addSecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
