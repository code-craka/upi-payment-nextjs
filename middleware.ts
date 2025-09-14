import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define route matchers
const isPublicRoute = createRouteMatcher([
  "/",
  "/pay/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin/(.*)"]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/orders(.*)",
  "/api/admin/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Get user role from session claims
  const userRole = (sessionClaims?.metadata as any)?.role as string;

  // Admin route protection
  if (isAdminRoute(req)) {
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Dashboard route protection (merchants and admins)
  if (isDashboardRoute(req)) {
    if (!userRole || !["admin", "merchant"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // API route protection
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Admin API routes
    if (req.nextUrl.pathname.startsWith("/api/admin")) {
      if (userRole !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
  }

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
