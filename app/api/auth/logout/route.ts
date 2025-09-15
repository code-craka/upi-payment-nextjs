import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SessionManager } from "@/lib/utils/session-manager";
import { withRateLimit, rateLimiters } from "@/lib/utils/rate-limiter";

export async function POST(req: NextRequest) {
  return withRateLimit(req, rateLimiters.auth, async () => {
    try {
      const { userId, sessionId } = await auth();

      if (!userId || !sessionId) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }

      // Invalidate session in our session manager
      await SessionManager.invalidateSession(sessionId);

      // Create response with cleared cookies
      const response = NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
      );

      // Clear authentication cookies
      response.cookies.delete("__session");
      response.cookies.delete("__clerk_db_jwt");
      response.cookies.delete("csrf-token");

      // Set security headers
      response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );

      return response;
    } catch (error) {
      console.error("Logout error:", error);
      return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }
  });
}
